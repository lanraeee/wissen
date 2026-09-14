import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { sendDonationReceipt } from '@/lib/email'
import { issueOrGetCertificate, type VerifiedDonation } from '@/lib/donations'

// (Re)sends a donation receipt, with certificate link, for an already-recorded
// donation identified by its payment reference. Useful for donations recorded
// before the certificate/receipt-link feature existed, or if a donor's
// original receipt email never arrived.
export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const key = process.env.RESEND_API_KEY
    console.error('[resend donation receipt]', err, {
      hasKey: !!key,
      keyLength: key?.length ?? 0,
      keyPrefix: key?.slice(0, 3) ?? null,
    })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }

  return NextResponse.json({ success: true, certId, certUrl, sentTo: donation.email })
}
