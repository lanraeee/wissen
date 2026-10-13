import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getPledge, recordProof, validateProof } from '@/lib/bank-transfer'
import { blobAccess, safeFileName } from '@/lib/whf-cio-files'
import { log } from '@/lib/logger'

// The donor's proof of payment (receipt or screenshot). Like the "I've sent it"
// step, this is keyed by the pledge reference, which is the donor's capability.
// The file lands in a private Blob store and is only ever read by an admin.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const reference = form?.get('reference')
  const file = form?.get('file')
  if (typeof reference !== 'string' || !reference.trim()) {
    return NextResponse.json({ error: 'Missing donation reference' }, { status: 400 })
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const invalid = validateProof(file)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const pledge = await getPledge(reference.trim())
  if (!pledge) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
  if (pledge.status === 'confirmed' || pledge.status === 'cancelled') {
    return NextResponse.json({ error: 'This transfer can no longer take proof of payment.' }, { status: 409 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'File storage is not configured' }, { status: 503 })
  }

  let blob
  try {
    blob = await put(`bank-transfer-proofs/${pledge.reference}-${safeFileName(file.name)}`, file, {
      access: blobAccess(),
      addRandomSuffix: true,
      contentType: file.type,
    })
  } catch (err) {
    log.error('bank transfer proof', err, { route: 'proof upload' })
    return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 502 })
  }

  try {
    await recordProof(pledge.reference, { blobPath: blob.pathname, fileName: file.name, contentType: file.type })
  } catch (err) {
    log.error('bank transfer proof', err, { route: 'proof record' })
    return NextResponse.json({ error: 'Could not save your upload. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ success: true, fileName: file.name })
}
