import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import sql from '@/lib/db'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
  const category = typeof body.category === 'string' ? body.category.trim() || null : undefined
  const notes = typeof body.notes === 'string' ? body.notes.trim() || null : undefined
  const workingCopy = typeof body.is_working_copy === 'boolean' ? body.is_working_copy : undefined

  try {
    // One statement so "make this the working copy" and "unmark the old one" cannot be seen half-done.
    // The constitution has a single working copy overall; everything else has one per linked record.
    const rows = await sql`
      WITH target AS (SELECT id, linked_type, linked_id FROM cio_documents WHERE id = ${id}),
      cleared AS (
        UPDATE cio_documents d SET is_working_copy = FALSE, updated_at = NOW()
        FROM target t
        WHERE ${workingCopy === true}::boolean
          AND d.id <> t.id
          AND d.is_working_copy
          AND d.linked_type IS NOT DISTINCT FROM t.linked_type
          AND (t.linked_type = 'constitution' OR d.linked_id IS NOT DISTINCT FROM t.linked_id)
        RETURNING d.id
      )
      UPDATE cio_documents SET
        title = COALESCE(${title}, title),
        category = CASE WHEN ${category !== undefined}::boolean THEN ${category ?? null} ELSE category END,
        notes = CASE WHEN ${notes !== undefined}::boolean THEN ${notes ?? null} ELSE notes END,
        is_working_copy = COALESCE(${workingCopy ?? null}::boolean, is_working_copy),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, category, linked_type, linked_id, file_name, content_type, size_bytes, is_working_copy, notes, uploaded_by, drive_status, created_at
    `
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logActivity(session, 'whf_cio.documents.update', { targetType: 'cio_documents', targetId: id })
    return NextResponse.json(rows[0])
  } catch (err) {
    log.error('whf-cio', err, { route: 'documents PUT', id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const rows = await sql`DELETE FROM cio_documents WHERE id = ${id} RETURNING blob_path`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // The record is the source of truth: if the blob delete fails the file is orphaned, not exposed.
    try {
      await del(rows[0].blob_path as string)
    } catch (err) {
      log.error('whf-cio', err, { route: 'documents DELETE blob', id })
    }
    await logActivity(session, 'whf_cio.documents.delete', { targetType: 'cio_documents', targetId: id })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('whf-cio', err, { route: 'documents DELETE', id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
