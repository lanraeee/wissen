import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { sendDonationReceipt } from '@/lib/email'
import { issueOrGetCertificate, type VerifiedDonation } from '@/lib/donations'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const ReferenceSchema = z.object({ reference: z.string().trim().min(1).max(100) })

// (Re)sends a donation receipt, with certificate link, for an already-recorded
// donation identified by its payment reference. Useful for donations recorded
// before the certificate/receipt-link feature existed, or if a donor's
// original receipt email never arrived.
export async function POST(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, ReferenceSchema)
  if (error) return error
  const { reference } = data

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
    log.error('resend donation receipt', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }

  logActivity(session, 'donation.resend_receipt', { targetType: 'submission', targetId: reference, details: { sentTo: donation.email } })
  return NextResponse.json({ success: true, certId, certUrl, sentTo: donation.email })
}
