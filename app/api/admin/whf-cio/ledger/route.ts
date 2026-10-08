import { NextRequest, NextResponse } from 'next/server'
import { sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { parseBody } from '@/lib/validation'
import { dbErrorResponse } from '@/lib/whf-cio'
import { listLedger, providerStatuses, syncLedger } from '@/lib/ledger'
import { ManualEntrySchema } from '@/lib/ledger-schema'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET also tops the feeds up: syncLedger() skips any provider polled in the
// last 15 minutes, so opening the tab is cheap but never shows a day-old list.
export async function GET() {
  const session = await sectionGuard('whf_cio.ledger')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    await syncLedger()
  } catch (err) {
    log.error('ledger', err, { stage: 'auto sync' })
  }

  try {
    const [entries, providers] = await Promise.all([listLedger(), providerStatuses()])
    return NextResponse.json({ entries, providers })
  } catch (err) {
    log.error('ledger', err)
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function POST(req: NextRequest) {
  const session = await sectionWriteGuard('whf_cio.ledger')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await parseBody(req, ManualEntrySchema)
  if (error) return error

  try {
    const [row] = await sql`
      INSERT INTO cio_ledger_entries
        (source, account_label, occurred_on, direction, amount, currency, description, category, counterparty, is_transfer, is_public, created_by, updated_by)
      VALUES
        ('manual', ${data.account_label}, ${data.occurred_on}, ${data.direction}, ${data.amount}, ${data.currency},
         ${data.description}, ${data.category ?? null}, ${data.counterparty}, ${data.is_transfer ?? false}, ${data.is_public ?? true},
         ${session.email}, ${session.email})
      RETURNING *
    `
    await logActivity(session, 'whf_cio.ledger.create', {
      targetType: 'cio_ledger_entries', targetId: row.id as string,
      details: { direction: data.direction, amount: data.amount, currency: data.currency, occurred_on: data.occurred_on },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    log.error('ledger', err)
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
