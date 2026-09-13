import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { sendDonationReceipt } from '@/lib/email'
import { issueOrGetCertificate, type VerifiedDonation } from '@/lib/donations'

// One-off/admin utility: (re)send a donation receipt (with certificate link)
// for an already-recorded donation, identified by its payment reference.
// Protected the same way as the other cron endpoints — a bearer secret,
// since it has no interactive session to check against.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'reference is required' }, { status: 400 })

  const [row] = await sql`
    SELECT data FROM submissions WHERE type = 'donation' AND data->>'reference' = ${reference} LIMIT 1
  `
  if (!row) return NextResponse.json({ error: 'No donation found for that reference' }, { status: 404 })

  const donation = row.data as VerifiedDonation

  const certId = await issueOrGetCertificate(donation)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const certUrl = certId ? `${siteUrl}/donate/receipt/${certId}` : undefined

  try {
    await sendDonationReceipt(donation.email, donation.name, donation.amount, donation.currency, donation.reference, certUrl)
  } catch (err) {
    console.error('[backfill donation receipt]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }

  return NextResponse.json({ success: true, certId, certUrl, sentTo: donation.email })
}
