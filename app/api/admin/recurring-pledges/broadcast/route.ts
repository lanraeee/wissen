import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { sendDonationRequestBroadcast } from '@/lib/email'
import { resolveBroadcastAudience, sendInBatches, type BroadcastCandidate } from '@/lib/newsletter'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const BroadcastSchema = z.object({
  projectSlug: z.string().trim().min(1).max(200),
  // 'pledges_pending' -- volunteer/partner applicants who haven't completed
  //   (or have lapsed on) their monthly gift; the ones admin follow-up
  //   already exists for.
  // 'pledges_all' -- every applicant who has ever set up a pledge,
  //   regardless of status, for a general campaign invitation.
  // 'subscribers' -- the manually-added / CSV-imported contact list
  //   (shared with the newsletter -- see /admin/newsletter?tab=subscribers).
  // 'users' -- every registered account, current AND future: this queries
  //   the live `users` table at send time, so a signup after this broadcast
  //   was composed but before it's reused is still included next time.
  // 'all' -- every one of the above, deduplicated by email.
  audience: z.enum(['pledges_pending', 'pledges_all', 'subscribers', 'users', 'all']),
  message: z.string().trim().max(2000).optional(),
})

async function candidatesFor(audience: z.infer<typeof BroadcastSchema>['audience']): Promise<BroadcastCandidate[]> {
  const out: BroadcastCandidate[] = []

  if (audience === 'pledges_pending' || audience === 'pledges_all' || audience === 'all') {
    const rows = audience === 'pledges_pending'
      ? await sql`
          SELECT DISTINCT ON (email) name, email FROM recurring_pledges
          WHERE status IN ('pending', 'declared', 'lapsed')
          ORDER BY email, created_at DESC
        `
      : await sql`SELECT DISTINCT ON (email) name, email FROM recurring_pledges ORDER BY email, created_at DESC`
    out.push(...rows.map(r => ({ name: r.name as string, email: r.email as string })))
  }

  if (audience === 'subscribers' || audience === 'all') {
    const rows = await sql`SELECT name, email FROM newsletter_subscribers WHERE status = 'subscribed'`
    out.push(...rows.map(r => ({ name: (r.name as string) || '', email: r.email as string })))
  }

  if (audience === 'users' || audience === 'all') {
    const rows = await sql`SELECT first_name, last_name, email FROM users`
    out.push(...rows.map(r => ({ name: `${r.first_name} ${r.last_name}`.trim(), email: r.email as string })))
  }

  return out
}

// One email per recipient (no exposed recipient list), same convention as
// the newsletter sender. Every recipient -- whichever pool they came from --
// is resolved through resolveBroadcastAudience(), which upserts them into
// newsletter_subscribers and filters back down to status = 'subscribed'.
// That's what makes this safe to point at 'users' or 'all' repeatedly: an
// address that bounced or unsubscribed via any previous send (campaign or
// broadcast) stays suppressed here too, rather than this route needing its
// own separate suppression list.
export async function POST(req: NextRequest) {
  const session = (await adminGuard() || await sectionWriteGuard('giving'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, BroadcastSchema)
  if (error) return error
  const { projectSlug, audience, message } = data

  const [project] = await sql`SELECT slug, title FROM donation_projects WHERE slug = ${projectSlug}`
  if (!project) return NextResponse.json({ error: 'Donation project not found' }, { status: 404 })

  const candidates = await candidatesFor(audience)
  const recipients = await resolveBroadcastAudience(candidates, `giving_broadcast:${audience}`)
  if (recipients.length === 0) return NextResponse.json({ success: true, sent: 0, total: 0 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const projectUrl = `${siteUrl}/donate/${project.slug}`

  const { sent, failed } = await sendInBatches(recipients, 10, r =>
    sendDonationRequestBroadcast({
      to: r.email, name: r.name, projectTitle: project.title as string, projectUrl, message,
      unsubscribeUrl: `${siteUrl}/unsubscribe?token=${r.unsubscribe_token}`,
    }).catch(err => {
      log.error('donation request broadcast', err, { email: r.email })
      throw err
    })
  )

  logActivity(session, 'recurring_pledge.broadcast', { targetType: 'donation_project', targetId: projectSlug, details: { audience, sent, failed, total: recipients.length } })
  return NextResponse.json({ success: true, sent, failed, total: recipients.length })
}
