import { NextResponse } from 'next/server'
import { signaturesGuard } from '@/lib/signature-access'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import {
  listSignatures, createSignature, deleteSignature,
  isValidSignatureImage, cleanSignatureName, UUID_RE,
} from '@/lib/signatures'

export async function GET() {
  const g = await signaturesGuard()
  if (!g) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  try {
    return NextResponse.json(await listSignatures(g.all ? null : g.session.email))
  } catch (err) {
    log.error('signatures', err)
    return NextResponse.json({ error: 'Could not load signatures' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const g = await signaturesGuard()
  if (!g) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json().catch(() => null)
  const name = cleanSignatureName(body?.name)
  if (!name) return NextResponse.json({ error: 'Give the signature a name' }, { status: 400 })
  if (!isValidSignatureImage(body?.image_data)) {
    return NextResponse.json({ error: 'Signature must be a PNG drawing under 300 KB' }, { status: 400 })
  }
  try {
    const row = await createSignature(g.session.email, name, body.image_data)
    await logActivity(g.session, 'signature.create', { targetType: 'saved_signature', targetId: row.id })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    log.error('signatures', err)
    return NextResponse.json({ error: 'Could not save signature' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const g = await signaturesGuard()
  if (!g) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    if (!(await deleteSignature(id, g.all ? null : g.session.email))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await logActivity(g.session, 'signature.delete', { targetType: 'saved_signature', targetId: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    log.error('signatures', err)
    return NextResponse.json({ error: 'Could not delete signature' }, { status: 500 })
  }
}
