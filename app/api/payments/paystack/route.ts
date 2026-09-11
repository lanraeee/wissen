import { NextRequest, NextResponse } from 'next/server'
import { verifyPaystackTransaction, recordDonation } from '@/lib/donations'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

// Initialize Paystack transaction
export async function POST(req: NextRequest) {
  const { email, name, amount, currency = 'NGN', callbackUrl } = await req.json()
  if (!email || !amount || amount < 100)
    return NextResponse.json({ error: 'Email and amount (min 100) required' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const base = callbackUrl ?? `${siteUrl}/donate/success`

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
      callback_url: `${base}${base.includes('?') ? '&' : '?'}provider=paystack`,
    }),
  })

  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })
  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference })
}

// Verify and record completed payment — called by the success page after
// Paystack redirects the donor back with ?reference=...
export async function PUT(req: NextRequest) {
  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

  const donation = await verifyPaystackTransaction(reference)
  if (!donation) return NextResponse.json({ error: 'Payment not verified' }, { status: 400 })

  await recordDonation(donation)
  return NextResponse.json({ success: true, amount: donation.amount, currency: donation.currency })
}
