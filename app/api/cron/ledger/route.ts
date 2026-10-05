import { NextRequest, NextResponse } from 'next/server'
import { syncLedger } from '@/lib/ledger'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Scheduled bank-feed sync, so the public ledger stays current even when no
// director opens the tab. Same bearer-secret pattern as the other crons.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await syncLedger({ force: true })
  log.info('ledger cron', 'ledger synced', { results })
  return NextResponse.json({ success: true, results })
}

export const GET = POST
