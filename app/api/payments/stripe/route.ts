import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { verifyStripeSession, recordDonation } from '@/lib/donations'

// Create a Stripe Checkout session for an international donation
export async function POST(req: NextRequest) {
  const { amount, currency = 'usd', name, email, callbackUrl } = await req.json()
  if (!amount || amount < 1 || !email)
    return NextResponse.json({ error: 'Email and amount (min 1) required' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const base = callbackUrl ?? `${siteUrl}/donate/success`
  const successUrl = `${base}${base.includes('?') ? '&' : '?'}provider=stripe&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${siteUrl}/donate`

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
}

// Verify and record a completed Checkout session — called by the success page,
// but kept as its own endpoint so it can also be triggered manually/via webhook.
export async function PUT(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const donation = await verifyStripeSession(sessionId)
  if (!donation) return NextResponse.json({ error: 'Payment not verified' }, { status: 400 })

  await recordDonation(donation)
  return NextResponse.json({ success: true, amount: donation.amount, currency: donation.currency })
}
