import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { sendDigest } from '@/lib/telegram-digest'
import { safeEqual } from '@/lib/telegram-shared'

export const dynamic = 'force-dynamic'
// Sends a handful of messages and two small queries: far under the limit.
// Declared for consistency with the other cron routes.
export const maxDuration = 60

// Every six hours, the admins linked in TELEGRAM_ADMINS receive a counts-only
// summary of the platform. Same bearer-secret pattern as the other crons, so
// GitHub Actions (.github/workflows/telegram-digest.yml) can call it.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !safeEqual(req.headers.get('authorization'), `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Telegram bot is not configured' }, { status: 503 })
  }

  try {
    const result = await sendDigest()
    log.info('telegram digest', 'summary sent', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    log.error('telegram digest', err)
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}

// Vercel Cron issues GET. Same handler, same auth.
export const GET = POST
