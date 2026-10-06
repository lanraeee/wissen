import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { sendDonationRequestBroadcast } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const BroadcastSchema = z.object({
  projectSlug: z.string().trim().min(1).max(200),
  // 'pending' targets applicants who haven't completed (or have lapsed on)
  // their monthly gift — the ones admin follow-up exists for. 'all' reaches
  // every volunteer/partner applicant who has ever set one up, regardless
  // of status, for a general campaign invitation.
  audience: z.enum(['pending', 'all']),
  message: z.string().trim().max(2000).optional(),
})

// One email per recipient (no exposed recipient list), same convention as
// the newsletter sender. Deliberately targets volunteer_applications/
// partner_inquiries via recurring_pledges rather than newsletter_subscribers
// — this is "ask the people who already engaged with us", not a general
// mailing list send.
export async function POST(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, BroadcastSchema)
  if (error) return error
  const { projectSlug, audience, message } = data

  const [project] = await sql`SELECT slug, title FROM donation_projects WHERE slug = ${projectSlug}`
  if (!project) return NextResponse.json({ error: 'Donation project not found' }, { status: 404 })

  const recipients = audience === 'pending'
    ? await sql`
        SELECT DISTINCT ON (email) name, email FROM recurring_pledges
        WHERE status IN ('pending', 'declared', 'lapsed')
        ORDER BY email, created_at DESC
      `
    : await sql`SELECT DISTINCT ON (email) name, email FROM recurring_pledges ORDER BY email, created_at DESC`

  if (recipients.length === 0) return NextResponse.json({ success: true, sent: 0 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const projectUrl = `${siteUrl}/donate/${project.slug}`

  let sent = 0
  for (const r of recipients) {
    try {
      await sendDonationRequestBroadcast({
        to: r.email as string, name: r.name as string, projectTitle: project.title as string, projectUrl, message,
      })
      sent++
    } catch (err) {
      log.error('donation request broadcast', err, { email: r.email as string })
    }
  }

  logActivity(session, 'recurring_pledge.broadcast', { targetType: 'donation_project', targetId: projectSlug, details: { audience, sent, total: recipients.length } })
  return NextResponse.json({ success: true, sent, total: recipients.length })
}
