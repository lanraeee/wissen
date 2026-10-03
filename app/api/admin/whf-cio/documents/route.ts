import { NextResponse, after } from 'next/server'
import { put } from '@vercel/blob'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import sql from '@/lib/db'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'
import { LINKED_TYPES, blobAccess, safeFileName, validateUpload } from '@/lib/whf-cio-files'
import { backupDocument } from '@/lib/whf-cio-drive'

export async function GET(request: Request) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(request.url)
  const linkedType = url.searchParams.get('linked_type')
  const linkedId = url.searchParams.get('linked_id')
  if (linkedType && !(LINKED_TYPES as readonly string[]).includes(linkedType)) return NextResponse.json({ error: 'Invalid linked_type' }, { status: 400 })
  if (linkedId && !UUID_RE.test(linkedId)) return NextResponse.json({ error: 'Invalid linked_id' }, { status: 400 })

  try {
    const rows = await sql`
      SELECT id, title, category, linked_type, linked_id, file_name, content_type, size_bytes,
             is_working_copy, notes, uploaded_by, drive_status, created_at
      FROM cio_documents
      WHERE (${linkedType}::text IS NULL OR linked_type = ${linkedType})
        AND (${linkedId}::uuid IS NULL OR linked_id = ${linkedId})
      ORDER BY is_working_copy DESC, created_at DESC
    `
    return NextResponse.json(rows)
  } catch (err) {
    log.error('whf-cio', err, { route: 'documents GET' })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function POST(request: Request) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'File storage is not configured (BLOB_READ_WRITE_TOKEN is missing)' }, { status: 503 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!form || !(file instanceof File)) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const invalid = validateUpload(file)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const str = (k: string) => { const v = form.get(k); return typeof v === 'string' && v.trim() ? v.trim() : null }
  const linkedType = str('linked_type')
  const linkedId = str('linked_id')
  if (linkedType && !(LINKED_TYPES as readonly string[]).includes(linkedType)) return NextResponse.json({ error: 'Invalid linked_type' }, { status: 400 })
  if (linkedId && !UUID_RE.test(linkedId)) return NextResponse.json({ error: 'Invalid linked_id' }, { status: 400 })
  const title = str('title') ?? file.name

  let blob
  try {
    blob = await put(`whf-cio/${safeFileName(file.name)}`, file, {
      access: blobAccess(),
      addRandomSuffix: true,
      contentType: file.type,
    })
  } catch (err) {
    log.error('whf-cio', err, { route: 'documents upload' })
    return NextResponse.json({ error: 'Upload failed — check that WHF_BLOB_ACCESS matches how the Blob store was created' }, { status: 502 })
  }

  try {
    const rows = await sql`
      INSERT INTO cio_documents (title, category, linked_type, linked_id, blob_path, file_name, content_type, size_bytes, notes, uploaded_by)
      VALUES (${title}, ${str('category')}, ${linkedType}, ${linkedId}, ${blob.pathname}, ${file.name}, ${file.type}, ${file.size}, ${str('notes')}, ${session.email})
      RETURNING id, title, category, linked_type, linked_id, file_name, content_type, size_bytes, is_working_copy, notes, uploaded_by, drive_status, created_at
    `
    await logActivity(session, 'whf_cio.documents.upload', { targetType: 'cio_documents', targetId: rows[0].id, details: { fileName: file.name } })
    const docId = rows[0].id as string
    after(() => backupDocument(docId))
    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    log.error('whf-cio', err, { route: 'documents insert' })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export const maxDuration = 30
