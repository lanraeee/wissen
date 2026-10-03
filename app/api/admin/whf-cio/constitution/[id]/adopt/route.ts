import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import sql from '@/lib/db'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const raw = typeof body.adopted_date === 'string' ? body.adopted_date.slice(0, 10) : null
  if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return NextResponse.json({ error: 'adopted_date must be YYYY-MM-DD' }, { status: 400 })

  try {
    // One statement: the previous adopted version is superseded only if this draft is actually adopted,
    // so there is never a moment with two adopted versions or none.
    const rows = await sql`
      WITH target AS (SELECT id FROM cio_constitution_versions WHERE id = ${id} AND status = 'draft'),
      superseded AS (
        UPDATE cio_constitution_versions SET status = 'superseded', updated_at = NOW()
        WHERE status = 'adopted' AND EXISTS (SELECT 1 FROM target)
        RETURNING id
      )
      UPDATE cio_constitution_versions
      SET status = 'adopted', adopted_date = COALESCE(${raw}::date, CURRENT_DATE), updated_at = NOW()
      WHERE id = ${id} AND status = 'draft'
      RETURNING id, version_label, status, body_text, adopted_date, change_summary, created_by, created_at, updated_at
    `
    if (!rows.length) {
      const exists = await sql`SELECT 1 FROM cio_constitution_versions WHERE id = ${id}`
      return exists.length
        ? NextResponse.json({ error: 'Only a draft can be adopted' }, { status: 409 })
        : NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await logActivity(session, 'whf_cio.constitution.adopt', { targetType: 'cio_constitution_versions', targetId: id })
    return NextResponse.json(rows[0])
  } catch (err) {
    log.error('whf-cio', err, { route: 'constitution adopt', id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
