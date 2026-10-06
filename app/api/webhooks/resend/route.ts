import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import sql from '@/lib/db'
import { log } from '@/lib/logger'

// Resend signs webhook deliveries the same way Svix does (it uses Svix under
// the hood), so verification is the same svix-id/svix-timestamp/svix-
// signature triad Stripe's webhook verifies with its own scheme -- see
// app/api/webhooks/stripe for that one.
//
// This is the other half of the deliverability story in lib/newsletter.ts's
// resolveBroadcastAudience(): a hard bounce or spam complaint on ANY send
// (newsletter campaign, donation-request broadcast, anything routed through
// newsletter_subscribers) permanently suppresses that address from every
// future send until a human clears it -- exactly what protects sender
// reputation (and so inbox placement) over time.
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    log.error('resend webhook', new Error('RESEND_WEBHOOK_SECRET is not set'))
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const payload = await req.text()
  // Typed as a plain Record (not svix's branded WebhookRequiredHeaders) so
  // TS resolves verify()'s `unknown`-returning overload below rather than
  // the one that returns `undefined`.
  const headers: Record<string, string> = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let event: { type: string; data: { email_id?: string; to?: string[] | string; bounce?: { type?: string } } }
  try {
    event = new Webhook(webhookSecret).verify(payload, headers) as unknown as typeof event
  } catch (err) {
    // Unsigned or tampered-with payload: never trusted, never acted on.
    log.error('resend webhook', err, { stage: 'signature verification' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'email.bounced' && event.type !== 'email.complained') {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  const to = event.data.to
  const recipients = Array.isArray(to) ? to : typeof to === 'string' ? [to] : []
  if (recipients.length === 0) return NextResponse.json({ received: true, ignored: 'no recipient on event' })

  const emails = recipients.map(e => e.trim().toLowerCase())

  try {
    if (event.type === 'email.bounced') {
      // Resend fires this for soft bounces too (mailbox temporarily full,
      // greylisting), not just hard failures -- but a false-positive
      // suppression costs one address on a list, where continuing to hammer
      // a genuinely dead mailbox costs the whole domain's reputation. Err
      // towards suppressing.
      await sql`
        UPDATE newsletter_subscribers SET status = 'bounced', bounced_at = NOW()
        WHERE email = ANY(${emails}) AND status = 'subscribed'
      `
    } else {
      await sql`
        UPDATE newsletter_subscribers SET status = 'complained', complained_at = NOW()
        WHERE email = ANY(${emails}) AND status = 'subscribed'
      `
    }
  } catch (err) {
    log.error('resend webhook', err, { stage: 'suppress', eventType: event.type })
    return NextResponse.json({ error: 'Could not suppress recipient' }, { status: 500 })
  }

  return NextResponse.json({ received: true, suppressed: emails.length })
}
