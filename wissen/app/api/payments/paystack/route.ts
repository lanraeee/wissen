import { NextRequest, NextResponse } from 'next/server'
import { sendDonationReceipt, sendDonationNotification } from '@/lib/email'
import sql from '@/lib/db'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

// Initialize Paystack transaction
export async function POST(req: NextRequest) {
  const { email, name, amount, currency = 'NGN' } = await req.json()
  if (!email || !amount || amount < 100)
    return NextResponse.json({ error: 'Email and amount (min 100) required' }, { status: 400 })

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // kobo
      currency,
      metadata: { name, custom_fields: [{ display_name: 'Donor Name', variable_name: 'name', value: name }] },
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'}/donate/success`,
    }),
  })

  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })
  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference })
}

// Verify and record completed payment (called from callback/webhook)
export async function PUT(req: NextRequest) {
  const { reference, name, email } = await req.json()
  if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  })
  const data = await res.json()

  if (!data.status || data.data.status !== 'success')
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 })

  const amount = data.data.amount / 100
  const currency = data.data.currency

  try {
    await sql`INSERT INTO submissions (type, data) VALUES ('donation', ${JSON.stringify({ name, email, amount, currency, reference, provider: 'Paystack' })})`
  } catch { /* non-fatal */ }

  try {
    await Promise.all([
      sendDonationReceipt(email, name || email, amount, currency, reference),
      sendDonationNotification({ name: name || email, email, amount, currency, ref: reference, provider: 'Paystack' }),
    ])
  } catch (err) { console.error('[paystack email]', err) }

  return NextResponse.json({ success: true, amount, currency })
}
