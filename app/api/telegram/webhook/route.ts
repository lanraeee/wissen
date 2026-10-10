import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { runAfterResponse } from '@/lib/background'
import { botToken, sendMessage } from '@/lib/telegram'
import { HELP_TEXT, parseAdmins, parseCommand, safeEqual, escapeHtml } from '@/lib/telegram-shared'
import {
  resolveActor, cmdStats, cmdSubmissions, cmdOpps, cmdHealth, cmdRun, cmdAsk,
} from '@/lib/telegram-commands'

export const dynamic = 'force-dynamic'
// /run executes a cron job in-process after the response is sent, so this
// route inherits the longest job's ceiling. Vercel reads this; App Service
// ignores it and caps requests at 230s (docs/AZURE_DEPLOYMENT.md).
export const maxDuration = 230

// Telegram redelivers an update it thinks failed. Remember recent update IDs
// so a retry cannot run a job twice. Per-instance and best-effort, like the
// rate limiter; the in-process jobs are idempotent anyway.
const seen = new Set<number>()
function firstTime(updateId: number): boolean {
  if (seen.has(updateId)) return false
  seen.add(updateId)
  if (seen.size > 500) seen.delete(seen.values().next().value as number)
  return true
}

interface TelegramUpdate {
  update_id: number
  message?: {
    text?: string
    chat: { id: number; type: string }
    from?: { id: number; username?: string }
  }
}

// Always answer Telegram with 200 once the request is authentic, even when
// the command fails: anything else makes Telegram retry the same update.
const OK = () => NextResponse.json({ ok: true })

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!botToken() || !secret) {
    return NextResponse.json({ error: 'Telegram bot is not configured' }, { status: 503 })
  }
  // Telegram sends back the secret_token given to setWebhook on every call.
  // Without it, anyone who learns this URL could post fake updates.
  if (!safeEqual(req.headers.get('x-telegram-bot-api-secret-token'), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let update: TelegramUpdate
  try {
    update = await req.json()
  } catch {
    return OK()
  }
  if (typeof update?.update_id !== 'number' || !firstTime(update.update_id)) return OK()

  const msg = update.message
  const fromId = msg?.from?.id
  if (!msg || !fromId) return OK()

  const parsed = parseCommand(msg.text, process.env.TELEGRAM_BOT_USERNAME || undefined)
  if (!parsed) return OK()
  const chatId = msg.chat.id

  // Private chats only. In a group, everyone present would see the replies,
  // and the person typing is not the only one reading.
  if (msg.chat.type !== 'private') return OK()

  const admins = parseAdmins(process.env.TELEGRAM_ADMINS)

  // Bootstrap: until at least one admin is linked, /whoami answers anyone
  // with their own numeric ID so the first admin can find it. Once the list
  // has an entry, strangers get no reply at all.
  if (parsed.command === 'whoami' && admins.size === 0) {
    await sendMessage(chatId, `Your Telegram ID is <code>${fromId}</code>.\nAdd <code>${fromId}:your-admin-email</code> to TELEGRAM_ADMINS.`, { html: true })
    return OK()
  }

  const email = admins.get(fromId)
  if (!email) {
    // Silent to the sender, visible in the logs, so an admin who forgot to
    // link themselves can find their ID without the bot advertising itself.
    log.warn('telegram', 'ignored command from unlinked account', { fromId, username: msg.from?.username, command: parsed.command })
    return OK()
  }

  const actor = await resolveActor(fromId, email).catch(err => {
    log.error('telegram', err, { fromId })
    return null
  })
  if (!actor) {
    await sendMessage(chatId, 'This Telegram account is linked to a website account that no longer has admin access.')
    return OK()
  }

  const { command, args } = parsed
  try {
    switch (command) {
      case 'start':
      case 'help':
        await sendMessage(chatId, HELP_TEXT, { html: true })
        break
      case 'whoami':
        await sendMessage(chatId, `Telegram ID: <code>${fromId}</code>\nLinked to: ${escapeHtml(actor.email)} (${escapeHtml(actor.role)})`, { html: true })
        break
      case 'stats':
        await cmdStats(chatId)
        break
      case 'submissions':
        await cmdSubmissions(chatId)
        break
      case 'opps':
        await cmdOpps(chatId)
        break
      case 'health':
        await cmdHealth(chatId)
        break
      // Slow commands run after the 200 goes back, so Telegram does not time
      // out and redeliver while a job or the AI agent is still working.
      case 'run':
        runAfterResponse(() => cmdRun(chatId, actor, args))
        break
      case 'ask':
        runAfterResponse(() => cmdAsk(chatId, actor, args))
        break
      default:
        await sendMessage(chatId, 'Unknown command. Send /help for the list.')
    }
  } catch (err) {
    log.error('telegram', err, { command })
    await sendMessage(chatId, 'That command failed. Details are in the server logs.')
  }

  return OK()
}
