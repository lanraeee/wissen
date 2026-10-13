import { log } from '@/lib/logger'
import { chunkText } from '@/lib/telegram-shared'

// Thin wrapper over the Telegram Bot API. A plain fetch rather than a bot
// library, for the same reason lib/ai-provider.ts is: two endpoints do not
// justify a dependency.

/**
 * `||` rather than `??` on purpose: a variable that is present but empty
 * must count as missing (see "Never set a variable to an empty string" in
 * docs/AZURE_DEPLOYMENT.md).
 */
export function botToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN || undefined
}

async function call(method: string, body: Record<string, unknown>): Promise<boolean> {
  const token = botToken()
  if (!token) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      // The token is in the URL, never in this log line.
      const detail = await res.text().catch(() => '')
      log.warn('telegram', `${method} failed`, { status: res.status, detail: detail.slice(0, 300) })
      return false
    }
    return true
  } catch (err) {
    log.error('telegram', err, { method })
    return false
  }
}

/**
 * Sends a reply, splitting anything over Telegram's length limit. `html`
 * turns on HTML parse mode, so callers must escape any interpolated values
 * with escapeHtml(). Model output is sent as plain text (html: false) so a
 * stray `<` in an answer can never make the message fail to send.
 */
export async function sendMessage(chatId: number, text: string, opts: { html?: boolean } = {}): Promise<void> {
  for (const chunk of chunkText(text)) {
    await call('sendMessage', {
      chat_id: chatId,
      text: chunk,
      ...(opts.html ? { parse_mode: 'HTML' } : {}),
      link_preview_options: { is_disabled: true },
    })
  }
}

/** Shows "typing..." while a slow command runs. Lasts about five seconds. */
export async function sendTyping(chatId: number): Promise<void> {
  await call('sendChatAction', { chat_id: chatId, action: 'typing' })
}
