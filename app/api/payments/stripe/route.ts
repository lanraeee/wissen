import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { verifyStripeSession, recordDonation } from '@/lib/donations'

// Create a Stripe Checkout session for a donation in any supported currency
export async function POST(req: NextRequest) {
  const { amount, currency = 'usd', name, email, callbackUrl } = await req.json()
  if (!amount || amount < 1 || !email)
    return NextResponse.json({ error: 'Email and amount (min 1) required' }, { status: 400 })

  if (!process.env.STRIPE_SECRET_KEY)
    return NextResponse.json({ error: 'Payments are not configured yet. Please try again shortly.' }, { status: 503 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const base = callbackUrl ?? `${siteUrl}/donate/success`
  const successUrl = `${base}${base.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${siteUrl}/donate`

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      // Managed Payments (Stripe's merchant-of-record mode) requires a tax
      // code on every line item, which doesn't apply to a donation — no
      // goods or services are exchanged. Opt this session out of it so
      // payment methods fall back to the account's normal configuration.
      managed_payments: { enabled: false },
      customer_email: email,
      line_items: [{
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: { name: 'Donation to Wissen-Haus Youth Empowerment Foundation' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: { name: name || '', email },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe checkout create]', err)
    const message = err instanceof Error ? err.message : 'Could not start checkout'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// Verify and record a completed Checkout session — called by the success page,
// but kept as its own endpoint so it can also be triggered manually/via webhook.
export async function PUT(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  try {
    const donation = await verifyStripeSession(sessionId)
    if (!donation) return NextResponse.json({ error: 'Payment not verified' }, { status: 400 })

    await recordDonation(donation)
    return NextResponse.json({ success: true, amount: donation.amount, currency: donation.currency })
  } catch (err) {
    console.error('[stripe checkout verify]', err)
    const message = err instanceof Error ? err.message : 'Could not verify payment'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
