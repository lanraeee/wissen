import { NextResponse } from 'next/server'
import { userAdminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { sendNewsletterEmail } from '@/lib/email'
import { sendInBatches } from '@/lib/newsletter'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { id } = await params

  // Atomically claim the campaign so a double-click can't send it twice.
  const [campaign] = await sql`
    UPDATE newsletter_campaigns SET status = 'sending' WHERE id = ${id} AND status = 'draft'
    RETURNING id, subject, body
  `
  if (!campaign) return NextResponse.json({ error: 'Campaign not found, or is not a draft' }, { status: 400 })

  const subscribers = await sql`
    SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE status = 'subscribed'
  `

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'

  const { sent, failed } = await sendInBatches(subscribers, 10, sub =>
    sendNewsletterEmail(
      sub.email as string,
      campaign.subject as string,
      campaign.body as string,
      `${siteUrl}/unsubscribe?token=${sub.unsubscribe_token}`
    ).catch(err => {
      log.error('newsletter campaign send', err, { campaignId: id, email: sub.email })
      throw err
    })
  )

  await sql`
    UPDATE newsletter_campaigns
    SET status = ${failed > 0 && sent === 0 ? 'failed' : 'sent'},
        recipient_count = ${subscribers.length}, sent_count = ${sent}, failed_count = ${failed}, sent_at = NOW()
    WHERE id = ${id}
  `

  logActivity(session, 'newsletter.send_campaign', {
    targetType: 'newsletter_campaign', targetId: id,
    details: { recipientCount: subscribers.length, sent, failed },
  })

  return NextResponse.json({ success: true, recipientCount: subscribers.length, sent, failed })
}
