import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { getPledge, updatePledge } from '@/lib/bank-transfer'
import { recordDonation, type VerifiedDonation } from '@/lib/donations'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const ReferenceSchema = z.object({ reference: z.string().trim().min(1).max(100) })

export async function GET() {
  if (!(await adminGuard() || await sectionGuard('bank_transfers'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`
    SELECT bt.*, d.cert_id AS cert_id
    FROM bank_transfers bt
    LEFT JOIN donations d ON d.id = bt.donation_id
    ORDER BY bt.created_at DESC
  `
  return NextResponse.json({ pledges: rows })
}

// Confirms the money actually landed in the account. This is the single point
// where a bank transfer becomes a real donation: recordDonation issues the
// certificate and sends the same receipt and admin notification a card
// donation would, so the donor's experience from here on is identical.
// Idempotent — recordDonation and the certificate issuer both no-op on a
// reference that has already been recorded.
export async function POST(req: NextRequest) {
  const session = (await adminGuard() || await sectionWriteGuard('bank_transfers'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, ReferenceSchema)
  if (error) return error
  const { reference } = data

  const pledge = await getPledge(reference)
  if (!pledge) return NextResponse.json({ error: 'No bank transfer found for that reference' }, { status: 404 })

  if (pledge.status === 'confirmed') {
    return NextResponse.json({ success: true, alreadyConfirmed: true, certId: pledge.cert_id, certUrl: `/donate/receipt/${pledge.cert_id}` })
  }

  const donation: VerifiedDonation = {
    amount: pledge.amount,
    currency: pledge.currency,
    name: pledge.name,
    email: pledge.email,
    reference: pledge.reference,
    provider: 'Bank Transfer',
  }

  let result
  try {
    result = await recordDonation(donation)
  } catch (err) {
    log.error('bank transfer confirm', err)
    return NextResponse.json({ error: 'Could not record the donation' }, { status: 502 })
  }
  if (!result.donation) return NextResponse.json({ error: 'Could not record the donation' }, { status: 502 })

  await updatePledge(reference, {
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    donation_id: result.donation.id,
  })

  const certId = result.donation.cert_id
  logActivity(session, 'bank_transfer.confirm', { targetType: 'bank_transfer', targetId: reference, details: { certId, amount: pledge.amount, currency: pledge.currency } })
  return NextResponse.json({ success: true, certId, certUrl: `/donate/receipt/${certId}` })
}

// Marks a pledge as cancelled (donor never sent the money, duplicate, etc.).
// The row is kept so the reference stays resolvable if the donor returns.
export async function DELETE(req: NextRequest) {
  const session = (await adminGuard() || await sectionWriteGuard('bank_transfers'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, ReferenceSchema)
  if (error) return error
  const { reference } = data

  const updated = await updatePledge(reference, { status: 'cancelled' })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  logActivity(session, 'bank_transfer.cancel', { targetType: 'bank_transfer', targetId: reference })
  return NextResponse.json({ success: true })
}
