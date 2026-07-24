import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendDonationReceipt, sendDonationNotification } from '@/lib/email'
import sql from '@/lib/db'

let _stripe: Stripe | null = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', { apiVersion: '2026-06-24.dahlia' })
  return _stripe
}

// Create payment intent
export async function POST(req: NextRequest) {
  const { amount, currency = 'gbp', name, email } = await req.json()
  if (!amount || amount < 1)
    return NextResponse.json({ error: 'Amount required (min Â£1)' }, { status: 400 })

  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { name: name || '', email: email || '' },
    receipt_email: email || undefined,
    description: 'Wissen-Haus donation',
  })

  return NextResponse.json({ clientSecret: intent.client_secret, intentId: intent.id })
}

// Confirm and record payment
export async function PUT(req: NextRequest) {
  const { intentId, name, email } = await req.json()
  if (!intentId) return NextResponse.json({ error: 'intentId required' }, { status: 400 })

  const intent = await getStripe().paymentIntents.retrieve(intentId)
  if (intent.status !== 'succeeded')
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })

  const amount = intent.amount / 100
  const currency = intent.currency.toUpperCase()
  const reference = intent.id

  try {
    await sql`INSERT INTO submissions (type, data) VALUES ('donation', ${JSON.stringify({ name, email, amount, currency, reference, provider: 'Stripe' })})`
  } catch { /* non-fatal */ }

  try {
    await Promise.all([
      sendDonationReceipt(email, name || email, amount, currency, reference),
      sendDonationNotification({ name: name || email, email, amount, currency, ref: reference, provider: 'Stripe' }),
    ])
  } catch (err) { console.error('[stripe email]', err) }

  return NextResponse.json({ success: true, amount, currency })
}

