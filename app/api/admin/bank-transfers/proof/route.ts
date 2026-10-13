import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { adminGuard, sectionGuard } from '@/lib/admin-guard'
import { getProofLocation } from '@/lib/bank-transfer'
import { blobAccess, contentDisposition } from '@/lib/whf-cio-files'
import { log } from '@/lib/logger'

// Proof of payment is served only through this route, so the admin check applies
// to every download whichever access mode the Blob store uses.
export async function GET(req: NextRequest) {
  if (!(await adminGuard() || await sectionGuard('bank_transfers'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const reference = req.nextUrl.searchParams.get('reference')?.trim()
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 })

  try {
    const proof = await getProofLocation(reference)
    if (!proof) return NextResponse.json({ error: 'No proof of payment on file' }, { status: 404 })

    const result = await get(proof.blobPath, { access: blobAccess() })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': proof.contentType || 'application/octet-stream',
        'Content-Disposition': contentDisposition(proof.fileName),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    log.error('bank transfer proof', err, { route: 'proof download' })
    return NextResponse.json({ error: 'Could not retrieve file' }, { status: 500 })
  }
}
