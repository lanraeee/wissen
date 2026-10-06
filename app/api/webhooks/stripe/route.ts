import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { verifyStripeSession, recordDonation } from '@/lib/donations'
import {
  verifyAndActivateStripeCheckout, recordStripeRenewal, markStripeLapsed, markStripeCancelled,
} from '@/lib/recurring-giving'
import { sendRecurringGivingConfirmed } from '@/lib/email'
import { log } from '@/lib/logger'

// Newer API versions moved an invoice's subscription off the top-level
// `subscription` field onto `parent.subscription_details.subscription`.
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

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

  // checkout.session.completed covers both one-time donations (mode:
  // 'payment') and the first cycle of a recurring pledge (mode:
  // 'subscription') — branch on the session's own mode rather than
  // maintaining two event-type lists.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode === 'subscription') {
      try {
        const pledge = await verifyAndActivateStripeCheckout(session.id)
        if (!pledge) return NextResponse.json({ received: true, activated: false })
        try {
          await sendRecurringGivingConfirmed({ to: pledge.email, name: pledge.name, amount: pledge.amount, nextDueAt: pledge.next_due_at })
        } catch (err) {
          log.error('recurring giving confirmed email (webhook)', err)
        }
        return NextResponse.json({ received: true, activated: true })
      } catch (err) {
        log.error('stripe webhook', err, { stage: 'activate subscription', sessionId: session.id })
        return NextResponse.json({ error: 'Could not activate subscription' }, { status: 500 })
      }
    }

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

  // Keeps an already-active recurring pledge's last_payment_at/next_due_at
  // rolling forward each billing cycle, without the donor ever having to
  // visit the site again.
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = subscriptionIdFromInvoice(invoice)
    if (!subscriptionId) return NextResponse.json({ received: true, ignored: 'no subscription on invoice' })
    try {
      await recordStripeRenewal(subscriptionId)
      return NextResponse.json({ received: true })
    } catch (err) {
      log.error('stripe webhook', err, { stage: 'record renewal', subscriptionId })
      return NextResponse.json({ error: 'Could not record renewal' }, { status: 500 })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = subscriptionIdFromInvoice(invoice)
    if (!subscriptionId) return NextResponse.json({ received: true, ignored: 'no subscription on invoice' })
    try {
      await markStripeLapsed(subscriptionId)
      return NextResponse.json({ received: true })
    } catch (err) {
      log.error('stripe webhook', err, { stage: 'mark lapsed', subscriptionId })
      return NextResponse.json({ error: 'Could not mark lapsed' }, { status: 500 })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    try {
      await markStripeCancelled(subscription.id)
      return NextResponse.json({ received: true })
    } catch (err) {
      log.error('stripe webhook', err, { stage: 'mark cancelled', subscriptionId: subscription.id })
      return NextResponse.json({ error: 'Could not mark cancelled' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true, ignored: event.type })
}
