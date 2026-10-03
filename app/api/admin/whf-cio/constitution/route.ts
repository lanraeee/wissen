import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import sql from '@/lib/db'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'

export async function GET() {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  try {
    const rows = await sql`
      SELECT id, version_label, status, body_text, adopted_date, change_summary, created_by, created_at, updated_at
      FROM cio_constitution_versions
      ORDER BY created_at DESC
    `
    return NextResponse.json(rows)
  } catch (err) {
    log.error('whf-cio', err, { route: 'constitution GET' })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function POST(request: Request) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const label = typeof body?.version_label === 'string' ? body.version_label.trim() : ''
  if (!label) return NextResponse.json({ error: 'version_label is required' }, { status: 400 })
  const summary = typeof body?.change_summary === 'string' && body.change_summary.trim() ? body.change_summary.trim() : null
  const copyFrom = typeof body?.copy_from === 'string' ? body.copy_from : null
  if (copyFrom && !UUID_RE.test(copyFrom)) return NextResponse.json({ error: 'Invalid copy_from' }, { status: 400 })
  const text = typeof body?.body_text === 'string' ? body.body_text : null

  try {
    const rows = await sql`
      INSERT INTO cio_constitution_versions (version_label, status, body_text, change_summary, created_by)
      VALUES (
        ${label}, 'draft',
        COALESCE(${text}, (SELECT body_text FROM cio_constitution_versions WHERE id = ${copyFrom})),
        ${summary}, ${session.email}
      )
      RETURNING id, version_label, status, body_text, adopted_date, change_summary, created_by, created_at, updated_at
    `
    await logActivity(session, 'whf_cio.constitution.create', { targetType: 'cio_constitution_versions', targetId: rows[0].id })
    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    log.error('whf-cio', err, { route: 'constitution POST' })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
