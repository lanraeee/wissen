import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { syncLedger } from '@/lib/ledger'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// "Sync now" in the ledger tab: polls every configured feed, ignoring the
// 15-minute throttle that GET applies.
export async function POST() {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const results = await syncLedger({ force: true })
  await logActivity(session, 'whf_cio.ledger.sync', { targetType: 'cio_ledger_entries', details: { results } })
  return NextResponse.json({ results })
}
