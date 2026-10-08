import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { sendDonationReceipt } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const ReferenceSchema = z.object({ reference: z.string().trim().min(1).max(100) })

// (Re)sends a donation receipt, with certificate link, for an already-recorded
// donation identified by its payment reference. Useful if a donor's original
// receipt email never arrived.
export async function POST(req: NextRequest) {
  const session = (await adminGuard() || await sectionGuard('donations'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, ReferenceSchema)
  if (error) return error
  const { reference } = data

  const [donation] = await sql`
    SELECT name, email, amount, currency, reference, cert_id FROM donations WHERE reference = ${reference} LIMIT 1
  `
  if (!donation) return NextResponse.json({ error: 'No donation found for that reference' }, { status: 404 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const certId = donation.cert_id as string | null
  const certUrl = certId ? `${siteUrl}/donate/receipt/${certId}` : undefined

  try {
    await sendDonationReceipt(donation.email, donation.name, Number(donation.amount), donation.currency, donation.reference, certUrl)
  } catch (err) {
    log.error('resend donation receipt', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }

  logActivity(session, 'donation.resend_receipt', { targetType: 'donation', targetId: reference, details: { sentTo: donation.email } })
  return NextResponse.json({ success: true, certId, certUrl, sentTo: donation.email })
}
