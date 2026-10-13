import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { getPledge, markProofRequested } from '@/lib/bank-transfer'
import { sendBankTransferProofRequest } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'

const ReferenceSchema = z.object({ reference: z.string().trim().min(1).max(100) })

// Asks a donor to upload proof of payment. Used for older transfers, or any
// transfer the donor declared sent without uploading a receipt.
export async function POST(req: NextRequest) {
  const session = (await adminGuard() || await sectionWriteGuard('bank_transfers'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await parseBody(req, ReferenceSchema)
  if (error) return error
  const { reference } = data

  const pledge = await getPledge(reference)
  if (!pledge) return NextResponse.json({ error: 'No bank transfer found for that reference' }, { status: 404 })
  if (pledge.status === 'confirmed' || pledge.status === 'cancelled') {
    return NextResponse.json({ error: 'This transfer is already closed.' }, { status: 409 })
  }
  if (pledge.proof_uploaded_at) {
    return NextResponse.json({ error: 'The donor has already uploaded proof of payment.' }, { status: 409 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  try {
    await sendBankTransferProofRequest({
      to: pledge.email,
      name: pledge.name,
      amount: pledge.amount,
      currency: pledge.currency,
      reference: pledge.reference,
      uploadUrl: `${siteUrl}/donate/bank-transfer/${pledge.reference}`,
    })
  } catch (err) {
    log.error('bank transfer proof request', err)
    return NextResponse.json({ error: 'The request email could not be sent. Nothing was changed, so try again.' }, { status: 502 })
  }

  await markProofRequested(pledge.reference)
  await logActivity(session, 'bank_transfer.request_proof', { targetType: 'bank_transfer', targetId: reference })
  return NextResponse.json({ success: true })
}
