import { NextRequest, NextResponse } from 'next/server'
import { directorGuard, safeguardingGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { parseBody } from '@/lib/validation'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'
import { TriageSchema, TRIAGE_FIELDS } from '@/lib/safeguarding-schema'
import sql from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }
type Row = Record<string, unknown>
const run = sql as unknown as (text: string, params?: unknown[]) => Promise<Row[]>

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await safeguardingGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await parseBody(req, TriageSchema)
  if (error) return error

  const values: Row = {}
  for (const k of TRIAGE_FIELDS) if (data[k] !== undefined) values[k] = data[k]
  if (values.status === 'closed' && !values.closed_on) values.closed_on = new Date().toISOString().slice(0, 10)
  if (Object.keys(values).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  try {
    // Column names come only from TRIAGE_FIELDS.
    const names = Object.keys(values)
    const text = `UPDATE cio_safeguarding_incidents SET ${names.map((n, i) => `${n} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${names.length + 1} RETURNING *`
    const [row] = await run(text, [...names.map(n => values[n]), id])
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Which fields changed, not their contents: the log is readable by more
    // people than the incident is.
    await logActivity(session, 'whf_cio.safeguarding.update', {
      targetType: 'cio_safeguarding_incidents', targetId: id,
      details: { reference: row.reference, fields: names, status: row.status, risk_level: row.risk_level },
    })
    return NextResponse.json(row)
  } catch (err) {
    log.error('safeguarding', err, { id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

// Directors only. Safeguarding records normally have to be kept; this exists
// for test entries and duplicates.
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Only directors can delete safeguarding records' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const rows = await sql`DELETE FROM cio_safeguarding_incidents WHERE id = ${id} RETURNING reference`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logActivity(session, 'whf_cio.safeguarding.delete', { targetType: 'cio_safeguarding_incidents', targetId: id, details: { reference: rows[0].reference } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('safeguarding', err, { id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
