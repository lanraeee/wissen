import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'
import { verifyStripeSession, recordDonation } from '@/lib/donations'
import { parseBody, zEmail } from '@/lib/validation'

const CheckoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(1).max(10).default('usd'),
  name: z.string().trim().max(100).optional(),
  email: zEmail,
  callbackUrl: z.string().max(500).optional(),
})

// Create a Stripe Checkout session for a donation in any supported currency
export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, CheckoutSchema)
  if (error) return error
  const { amount, currency, name, email, callbackUrl } = data

  if (!process.env.STRIPE_SECRET_KEY)
    return NextResponse.json({ error: 'Payments are not configured yet. Please try again shortly.' }, { status: 503 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  // callbackUrl is only ever used to build the redirect Stripe sends the donor
  // back to — only accept it when its origin matches our own site, otherwise
  // it could be used as an open redirect to an attacker-controlled domain.
  let base = `${siteUrl}/donate/success`
  if (callbackUrl) {
    try {
      const parsed = new URL(callbackUrl)
      const allowedOrigins = [new URL(siteUrl).origin, req.nextUrl.origin]
      if (allowedOrigins.includes(parsed.origin)) base = callbackUrl
    } catch { /* not a valid absolute URL — ignore, use default */ }
  }
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
          product_data: { name: 'Donation to Wissen-Haus Empowerment Foundation' },
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

const VerifySchema = z.object({ sessionId: z.string().trim().min(1).max(300) })

// Verify and record a completed Checkout session — called by the success page,
// but kept as its own endpoint so it can also be triggered manually/via webhook.
export async function PUT(req: NextRequest) {
  const { data, error } = await parseBody(req, VerifySchema)
  if (error) return error
  const { sessionId } = data

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
