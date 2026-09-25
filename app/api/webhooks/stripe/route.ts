import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { verifyStripeSession, recordDonation } from '@/lib/donations'
import { log } from '@/lib/logger'

// Without this, a donation was only ever recorded when the browser came back to
// /donate/success and issued the PUT — so a closed tab or a dropped redirect
// left a paid donation with no row, no certificate and no receipt. Stripe
// retries this endpoint until it gets a 2xx, which closes that gap.
//
// recordDonation() is idempotent on the Checkout Session id, so the webhook and
// the success page racing each other is fine: whichever arrives second is a
// no-op.

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    log.error('stripe webhook', new Error('STRIPE_WEBHOOK_SECRET is not set'))
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })

  // Stripe signs the exact bytes it sent, so this has to be the raw body.
  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, webhookSecret)
  } catch (err) {
    // Unsigned or tampered-with payload: never retried, never recorded.
    log.error('stripe webhook', err, { stage: 'signature verification' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session

  try {
    // Re-fetch the session rather than trusting the event body, so the
    // payment_status check lives in one place for both entry points.
    const donation = await verifyStripeSession(session.id)
    if (!donation) return NextResponse.json({ received: true, recorded: false })

    const { recorded } = await recordDonation(donation)
    return NextResponse.json({ received: true, recorded })
  } catch (err) {
    // 5xx so Stripe retries a transient database or email failure.
    log.error('stripe webhook', err, { stage: 'record donation', sessionId: session.id })
    return NextResponse.json({ error: 'Could not record donation' }, { status: 500 })
  }
}
