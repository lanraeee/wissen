// Pure helpers for the Telegram command center. No database, no network, so
// they are cheap to unit test and safe to import anywhere.

/** Telegram rejects messages over 4096 characters; leave room for a footer. */
export const TELEGRAM_MAX_CHARS = 4000

/** The cron jobs /run may trigger. Each maps to app/api/cron/<name>/route.ts. */
export const CRON_JOBS = ['opportunities', 'knowledge', 'ledger', 'recurring-giving'] as const
export type CronJob = (typeof CRON_JOBS)[number]

export function isCronJob(value: string): value is CronJob {
  return (CRON_JOBS as readonly string[]).includes(value)
}

/**
 * Parses TELEGRAM_ADMINS: comma-separated `telegramUserId:email` pairs, e.g.
 * `123456789:wissenhaus@outlook.com,987654321:someone@wissenhaus.org`.
 *
 * Each Telegram account is linked to a website account by email, so the
 * person's admin role is re-checked against the database on every command:
 * demoting someone in the admin panel removes their Telegram access too,
 * without anyone having to remember to edit this variable.
 *
 * Malformed entries are skipped rather than failing the whole list, so one
 * typo cannot lock every admin out.
 */
export function parseAdmins(raw: string | undefined): Map<number, string> {
  const map = new Map<number, string>()
  if (!raw) return map
  for (const part of raw.split(',')) {
    const [idRaw, ...rest] = part.split(':')
    const id = Number(idRaw?.trim())
    const email = rest.join(':').trim().toLowerCase()
    if (!Number.isSafeInteger(id) || id <= 0 || !email.includes('@')) continue
    map.set(id, email)
  }
  return map
}

export interface ParsedCommand {
  command: string
  args: string
}

/**
 * Splits `/run@WissenBot knowledge` into `{ command: 'run', args: 'knowledge' }`.
 * Returns null for anything that is not a command. A command addressed to a
 * different bot (`/stats@OtherBot`) is also null.
 */
export function parseCommand(text: string | undefined, botUsername?: string): ParsedCommand | null {
  if (!text) return null
  const match = text.trim().match(/^\/([a-zA-Z0-9_]+)(?:@([a-zA-Z0-9_]+))?(?:\s+([\s\S]*))?$/)
  if (!match) return null
  const [, command, target, args] = match
  if (target && botUsername && target.toLowerCase() !== botUsername.toLowerCase()) return null
  return { command: command.toLowerCase(), args: (args ?? '').trim() }
}

/** Splits text into Telegram-sized pieces, preferring line breaks. */
export function chunkText(text: string, max = TELEGRAM_MAX_CHARS): string[] {
  if (text.length <= max) return [text]
  const chunks: string[] = []
  let rest = text
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max)
    if (cut < max / 2) cut = rest.lastIndexOf(' ', max)
    if (cut < max / 2) cut = max
    chunks.push(rest.slice(0, cut).trimEnd())
    rest = rest.slice(cut).trimStart()
  }
  if (rest) chunks.push(rest)
  return chunks
}

/** Escapes text for Telegram's HTML parse mode. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Constant-time comparison for the webhook secret header, so response timing
 * reveals nothing about how much of a guessed secret was right.
 */
export function safeEqual(a: string | null | undefined, b: string): boolean {
  if (typeof a !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const HELP_TEXT = [
  '<b>Wissen-Haus command center</b>',
  '',
  '/stats - users, learners and pending submissions',
  '/submissions - latest pending contact, volunteer and partner entries',
  '/opps - opportunity listings and when they last refreshed',
  '/health - database, host, build and AI status',
  `/run &lt;job&gt; - run a job now: ${CRON_JOBS.join(', ')}`,
  '/ask &lt;question&gt; - ask the database agent (read-only)',
  '/whoami - your Telegram ID and linked account',
  '/help - this list',
].join('\n')
