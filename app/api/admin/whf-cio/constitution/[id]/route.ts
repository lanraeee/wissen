import { NextResponse } from 'next/server'
import { sectionGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import sql from '@/lib/db'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'

type Ctx = { params: Promise<{ id: string }> }

// Adopted and superseded versions are the legal record: only drafts can be edited or deleted.
export async function PUT(request: Request, { params }: Ctx) {
  const session = await sectionGuard('whf_cio.constitution')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const label = typeof body.version_label === 'string' && body.version_label.trim() ? body.version_label.trim() : null
  const text = typeof body.body_text === 'string' ? body.body_text : undefined
  const summary = typeof body.change_summary === 'string' ? body.change_summary.trim() || null : undefined
  if (label === null && text === undefined && summary === undefined) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  try {
    const rows = await sql`
      UPDATE cio_constitution_versions SET
        version_label = COALESCE(${label}, version_label),
        body_text = CASE WHEN ${text !== undefined}::boolean THEN ${text ?? null} ELSE body_text END,
        change_summary = CASE WHEN ${summary !== undefined}::boolean THEN ${summary ?? null} ELSE change_summary END,
        updated_at = NOW()
      WHERE id = ${id} AND status = 'draft'
      RETURNING id, version_label, status, body_text, adopted_date, change_summary, created_by, created_at, updated_at
    `
    if (!rows.length) {
      const exists = await sql`SELECT status FROM cio_constitution_versions WHERE id = ${id}`
      return exists.length
        ? NextResponse.json({ error: 'Only draft versions can be edited — create a new draft from this version instead' }, { status: 409 })
        : NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await logActivity(session, 'whf_cio.constitution.update', { targetType: 'cio_constitution_versions', targetId: id })
    return NextResponse.json(rows[0])
  } catch (err) {
    log.error('whf-cio', err, { route: 'constitution PUT', id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await sectionGuard('whf_cio.constitution')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const rows = await sql`DELETE FROM cio_constitution_versions WHERE id = ${id} AND status = 'draft' RETURNING id`
    if (!rows.length) {
      const exists = await sql`SELECT 1 FROM cio_constitution_versions WHERE id = ${id}`
      return exists.length
        ? NextResponse.json({ error: 'Only draft versions can be deleted' }, { status: 409 })
        : NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await logActivity(session, 'whf_cio.constitution.delete', { targetType: 'cio_constitution_versions', targetId: id })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('whf-cio', err, { route: 'constitution DELETE', id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
