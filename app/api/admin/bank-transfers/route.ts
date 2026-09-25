import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { getPledge, updatePledge } from '@/lib/bank-transfer'
import { certIdForReference, recordDonation, type VerifiedDonation } from '@/lib/donations'

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`
    SELECT id, name, email, data, status, created_at
    FROM submissions
    WHERE type = 'bank_transfer'
    ORDER BY created_at DESC
  `
  return NextResponse.json({ pledges: rows })
}

// Confirms the money actually landed in the account. This is the single point
// where a bank transfer becomes a real donation: recordDonation issues the
// certificate and sends the same receipt and admin notification a card
// donation would, so the donor's experience from here on is identical.
// Idempotent â€” recordDonation and the certificate issuer both no-op on a
// reference that has already been recorded.
export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

  const pledge = await getPledge(reference)
  if (!pledge) return NextResponse.json({ error: 'No bank transfer found for that reference' }, { status: 404 })

  const certId = pledge.cert_id ?? certIdForReference(pledge.reference)

  if (pledge.status === 'confirmed') {
    return NextResponse.json({ success: true, alreadyConfirmed: true, certId, certUrl: `/donate/receipt/${certId}` })
  }

  const donation: VerifiedDonation = {
    amount: pledge.amount,
    currency: pledge.currency,
    name: pledge.name,
    email: pledge.email,
    reference: pledge.reference,
    provider: 'Bank Transfer',
  }

  try {
    await recordDonation(donation)
  } catch (err) {
    console.error('[bank transfer confirm]', err)
    return NextResponse.json({ error: 'Could not record the donation' }, { status: 502 })
  }

  await updatePledge(reference, {
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    cert_id: certId,
  })

  return NextResponse.json({ success: true, certId, certUrl: `/donate/receipt/${certId}` })
}

// Marks a pledge as cancelled (donor never sent the money, duplicate, etc.).
// The row is kept so the reference stays resolvable if the donor returns.
export async function DELETE(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

  const updated = await updatePledge(reference, { status: 'cancelled' })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
