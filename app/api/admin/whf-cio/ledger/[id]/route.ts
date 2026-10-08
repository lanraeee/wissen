import { NextRequest, NextResponse } from 'next/server'
import { directorGuard, sectionGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { parseBody } from '@/lib/validation'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'
import { OVERRIDABLE, diffRow } from '@/lib/ledger'
import { OverrideSchema } from '@/lib/ledger-schema'
import sql from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }
type Row = Record<string, unknown>
const run = sql as unknown as (text: string, params?: unknown[]) => Promise<Row[]>

// Editing a manual entry is ordinary bookkeeping. Editing a synced one is a
// director override of what the bank reported: it needs a reason, marks the
// row overridden (so the next sync leaves it alone), keeps the bank's values
// in `original` the first time, and writes the before/after to the audit log.
// Deliberately still director-only (not sectionGuard), unlike DELETE below:
// a trustee granted the Ledger tab can add/remove their own manual entries,
// but overriding what the bank itself reported stays a director act.
export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await parseBody(req, OverrideSchema)
  if (error) return error

  try {
    const [before] = await sql`SELECT * FROM cio_ledger_entries WHERE id = ${id}`
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const values: Row = {}
    for (const k of OVERRIDABLE) if (k in data && data[k] !== undefined) values[k] = data[k]
    const changes = diffRow(before, values)
    if (Object.keys(changes).length === 0) return NextResponse.json(before)

    const synced = before.source !== 'manual'
    if (synced) {
      if (!data.override_reason) {
        return NextResponse.json({ error: 'Give a reason for overriding a bank-synced entry' }, { status: 400 })
      }
      values.overridden = true
      values.override_reason = data.override_reason
      if (!before.original) {
        const snapshot: Row = {}
        for (const k of OVERRIDABLE) snapshot[k] = before[k] ?? null
        values.original = JSON.stringify(snapshot)
      }
    }
    values.updated_by = session.email

    // Column names come only from OVERRIDABLE and the fixed keys above.
    const names = Object.keys(values)
    const text = `UPDATE cio_ledger_entries SET ${names.map((n, i) => `${n} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${names.length + 1} RETURNING *`
    const [row] = await run(text, [...names.map(n => values[n]), id])

    await logActivity(session, synced ? 'whf_cio.ledger.override' : 'whf_cio.ledger.update', {
      targetType: 'cio_ledger_entries', targetId: id,
      details: { source: before.source, reason: data.override_reason ?? null, changes },
    })
    return NextResponse.json(row)
  } catch (err) {
    log.error('ledger', err, { id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

// Only manual entries can be deleted. A synced row would simply come back on
// the next sync; excluding it is the way to take it out of the figures.
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const session = await sectionGuard('whf_cio.ledger')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const [row] = await sql`SELECT source, direction, amount, currency, occurred_on, description FROM cio_ledger_entries WHERE id = ${id}`
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (row.source !== 'manual') {
      return NextResponse.json({ error: 'Bank-synced entries cannot be deleted. Mark the entry as excluded instead.' }, { status: 400 })
    }
    await sql`DELETE FROM cio_ledger_entries WHERE id = ${id}`
    await logActivity(session, 'whf_cio.ledger.delete', { targetType: 'cio_ledger_entries', targetId: id, details: { deleted: row } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('ledger', err, { id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
