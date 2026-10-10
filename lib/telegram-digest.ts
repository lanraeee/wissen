import sql from '@/lib/db'
import { log } from '@/lib/logger'
import { getAiSettings } from '@/lib/ai-settings'
import { resolveProvider } from '@/lib/ai-provider'
import { sendMessage } from '@/lib/telegram'
import { escapeHtml, parseAdmins } from '@/lib/telegram-shared'
import { resolveActor, type TelegramActor } from '@/lib/telegram-commands'

// How far back "new since last digest" looks. Matches the schedule in
// .github/workflows/telegram-digest.yml; keep the two in step.
export const DIGEST_WINDOW_HOURS = 6

// Postgres returns COUNT(*) as a string, so this just passes the value through
// as text. That keeps a fallback like "unavailable" readable instead of NaN.
function count(rows: Record<string, unknown>[] | undefined): string {
  return String(rows?.[0]?.c ?? 0)
}

function hostName(): string {
  if (process.env.VERCEL) return `Vercel (${process.env.VERCEL_ENV || 'unknown env'})`
  if (process.env.WEBSITE_SITE_NAME) return `Azure App Service (${process.env.WEBSITE_SITE_NAME})`
  return 'Unknown host'
}

/**
 * Builds the digest text as Telegram HTML. Counts and timestamps only: no
 * names, emails or message bodies, so the summary can be read on a phone
 * lock screen without exposing anyone's personal details.
 *
 * Each query is independent. If one table is unavailable the line reads
 * "unavailable" rather than the whole digest failing, because a partial
 * summary is more useful during an incident than no summary.
 */
export async function buildDigest(now = new Date()): Promise<string> {
  const windowStart = new Date(now.getTime() - DIGEST_WINDOW_HOURS * 3_600_000).toISOString()
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn() } catch (err) {
      log.warn('telegram digest', 'query failed', { error: String(err).slice(0, 200) })
      return fallback
    }
  }
  const na = [{ c: 'unavailable' }]

  const [users, contact, volunteer, partner, donations, pendingContact, pendingVolunteer, pendingPartner, tickets, opps, lastRefresh] = await Promise.all([
    safe(() => sql`SELECT COUNT(*) AS c FROM users WHERE created_at >= ${windowStart}`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM contact_messages WHERE created_at >= ${windowStart}`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM volunteer_applications WHERE created_at >= ${windowStart}`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM partner_inquiries WHERE created_at >= ${windowStart}`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM donations WHERE created_at >= ${windowStart}`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'pending'`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM volunteer_applications WHERE status = 'pending'`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM partner_inquiries WHERE status = 'pending'`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM support_tickets WHERE status IN ('open','pending')`, na),
    safe(() => sql`SELECT COUNT(*) AS c FROM opportunities`, na),
    safe(() => sql`SELECT MAX(updated_at) AS updated FROM opportunities`, [{ updated: null }]),
  ] as const)

  let db = 'OK'
  const started = Date.now()
  try {
    await sql`SELECT 1`
    db = `OK (${Date.now() - started} ms)`
  } catch {
    db = 'FAILING'
  }

  const settings = await getAiSettings()
  const provider = resolveProvider(settings.provider)
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || ''
  const refreshed = (lastRefresh[0] as { updated: string | null } | undefined)?.updated
  const refreshedAgo = refreshed
    ? `${Math.round((now.getTime() - new Date(refreshed).getTime()) / 3_600_000)} h ago`
    : 'never'

  const lines = [
    `<b>Wissen-Haus summary</b>`,
    `<i>${escapeHtml(now.toISOString().slice(0, 16).replace('T', ' '))} UTC · last ${DIGEST_WINDOW_HOURS} hours</i>`,
    '',
    '<b>New since last summary</b>',
    `Sign-ups: ${count(users as Record<string, unknown>[])}`,
    `Contact: ${count(contact as Record<string, unknown>[])} · Volunteer: ${count(volunteer as Record<string, unknown>[])} · Partner: ${count(partner as Record<string, unknown>[])}`,
    `Donations recorded: ${count(donations as Record<string, unknown>[])}`,
    '',
    '<b>Waiting for a reply</b>',
    `Contact: ${count(pendingContact as Record<string, unknown>[])} · Volunteer: ${count(pendingVolunteer as Record<string, unknown>[])} · Partner: ${count(pendingPartner as Record<string, unknown>[])}`,
    `Open support tickets: ${count(tickets as Record<string, unknown>[])}`,
    '',
    '<b>Opportunities</b>',
    `Listed: ${count(opps as Record<string, unknown>[])} · last refreshed ${escapeHtml(refreshedAgo)}`,
    '',
    '<b>Health</b>',
    `Database: ${escapeHtml(db)}`,
    `Host: ${escapeHtml(hostName())}`,
    `Build: ${commit ? `<code>${escapeHtml(commit.slice(0, 7))}</code>` : 'unknown'}`,
    `AI: ${provider ? `credential present (${escapeHtml(provider.provider)})` : 'no credential configured'}`,
  ]
  return lines.join('\n')
}

/**
 * Sends the digest to every admin in TELEGRAM_ADMINS who still qualifies.
 * Re-checking each account here means a demoted admin stops receiving the
 * summary on the next run, the same as every other bot command.
 */
export async function sendDigest(now = new Date()): Promise<{ recipients: number; skipped: number }> {
  const admins = parseAdmins(process.env.TELEGRAM_ADMINS)
  if (admins.size === 0) return { recipients: 0, skipped: 0 }

  const text = await buildDigest(now)
  let recipients = 0
  let skipped = 0
  for (const [telegramId, email] of admins) {
    const actor: TelegramActor | null = await resolveActor(telegramId, email).catch(() => null)
    if (!actor) { skipped++; continue }
    await sendMessage(telegramId, text, { html: true })
    recipients++
  }
  return { recipients, skipped }
}
