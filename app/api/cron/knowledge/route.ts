import { NextRequest, NextResponse } from 'next/server'
import { rebuildKnowledgeBase } from '@/lib/knowledge-base'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Nightly rebuild, scheduled after the opportunities cron so the knowledge
// base summarises the listings that job has just refreshed rather than
// yesterday's. Same bearer-secret pattern as that route.
//
// Only 'server' entries are touched: staff-approved answers are not
// regenerable and a rebuild must never remove them.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await rebuildKnowledgeBase()
    log.info('kb cron', 'knowledge base rebuilt', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    log.error('kb cron', err)
    return NextResponse.json({ error: 'Rebuild failed' }, { status: 500 })
  }
}

// Vercel Cron issues GET. Same handler, same auth.
export const GET = POST
