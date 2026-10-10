import { NextRequest } from 'next/server'
import sql from '@/lib/db'
import { log } from '@/lib/logger'
import { logActivity, type Actor } from '@/lib/audit-log'
import { isBlockedAdmin, isDirector, isMasterAdmin } from '@/lib/admin-guard'
import { canUseAdminAgent, getAiSettings } from '@/lib/ai-settings'
import { resolveProvider } from '@/lib/ai-provider'
import { askAdminAgent } from '@/lib/admin-agent'
import { sendMessage, sendTyping } from '@/lib/telegram'
import { CRON_JOBS, escapeHtml, isCronJob, type CronJob } from '@/lib/telegram-shared'

// The roles adminGuard() in lib/admin-guard.ts admits as general staff. The
// command center is the Telegram equivalent of that guard, so it admits
// exactly the same set. Trustees are deliberately left out: in the web app a
// trustee starts with zero access and sees a section only once the master
// admin grants it (sectionGuard), so they must not get blanket access to
// submissions or stats here.
const STAFF_ROLES = new Set(['admin', 'editor'])

export interface TelegramActor extends Actor {
  telegramId: number
}

/**
 * Turns a linked email into a live admin. Re-read from the database on every
 * command, so a demotion or deletion in the admin panel takes effect on the
 * very next message. Returns null when the account no longer qualifies.
 */
export async function resolveActor(telegramId: number, email: string): Promise<TelegramActor | null> {
  if (isBlockedAdmin(email)) return null
  const rows = await sql`SELECT id, email, role FROM users WHERE LOWER(email) = ${email} LIMIT 1` as
    { id: string; email: string; role: string }[]
  const user = rows[0]
  if (!user) return null
  if (!isMasterAdmin(user.email) && !STAFF_ROLES.has(user.role)) return null
  return { id: user.id, email: user.email, role: user.role, telegramId }
}

function count(rows: Record<string, unknown>[]): number {
  return Number(rows[0]?.c ?? 0)
}

function ago(value: unknown): string {
  if (!value) return 'never'
  const ms = Date.now() - new Date(String(value)).getTime()
  if (!Number.isFinite(ms)) return 'unknown'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}

export async function cmdStats(chatId: number): Promise<void> {
  const [users, users7, learners, certs, contact, volunteer, partner, tickets, opps] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM users`,
    sql`SELECT COUNT(*) AS c FROM users WHERE created_at > NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(DISTINCT user_id) AS c FROM course_progress`,
    sql`SELECT COUNT(*) AS c FROM certificates`,
    sql`SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'pending'`,
    sql`SELECT COUNT(*) AS c FROM volunteer_applications WHERE status = 'pending'`,
    sql`SELECT COUNT(*) AS c FROM partner_inquiries WHERE status = 'pending'`,
    sql`SELECT COUNT(*) AS c FROM support_tickets WHERE status IN ('open','pending')`,
    sql`SELECT COUNT(*) AS c FROM opportunities`,
  ])

  await sendMessage(chatId, [
    '<b>Wissen-Haus at a glance</b>',
    '',
    `Users: <b>${count(users)}</b> (+${count(users7)} in 7 days)`,
    `Active learners: ${count(learners)}`,
    `Certificates issued: ${count(certs)}`,
    `Opportunities listed: ${count(opps)}`,
    '',
    '<b>Waiting for a reply</b>',
    `Contact: ${count(contact)}`,
    `Volunteer: ${count(volunteer)}`,
    `Partner: ${count(partner)}`,
    `Open support tickets: ${count(tickets)}`,
  ].join('\n'), { html: true })
}

// Names and subject lines only. Message bodies and email addresses stay in
// the admin panel: a Telegram chat is a weaker place to hold personal data,
// and this is enough to know whether something needs attention.
export async function cmdSubmissions(chatId: number): Promise<void> {
  const rows = await sql`
    SELECT 'Contact' AS kind, name, subject AS detail, created_at FROM contact_messages WHERE status = 'pending'
    UNION ALL
    SELECT 'Volunteer', name, role, created_at FROM volunteer_applications WHERE status = 'pending'
    UNION ALL
    SELECT 'Partner', name, organisation, created_at FROM partner_inquiries WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 10
  ` as { kind: string; name: string; detail: string | null; created_at: string }[]

  if (!rows.length) {
    await sendMessage(chatId, 'Nothing pending. Every contact, volunteer and partner submission has been handled.')
    return
  }

  const lines = rows.map(r =>
    `• <b>${escapeHtml(r.kind)}</b>: ${escapeHtml(r.name)}${r.detail ? ` — ${escapeHtml(r.detail.slice(0, 80))}` : ''} <i>(${ago(r.created_at)})</i>`)
  await sendMessage(chatId, [
    `<b>Latest pending submissions</b> (${rows.length} shown)`,
    '',
    ...lines,
    '',
    'Open the admin panel to read and reply.',
  ].join('\n'), { html: true })
}

export async function cmdOpps(chatId: number): Promise<void> {
  const [typeRows, lastRows] = await Promise.all([
    sql`SELECT type, COUNT(*) AS c FROM opportunities GROUP BY type ORDER BY COUNT(*) DESC`,
    sql`SELECT MAX(updated_at) AS updated, MAX(first_seen_at) AS newest FROM opportunities`,
  ])
  const byType = typeRows as { type: string; c: string }[]
  const last = lastRows as { updated: string | null; newest: string | null }[]
  const total = byType.reduce((n, r) => n + Number(r.c), 0)
  await sendMessage(chatId, [
    `<b>Opportunities</b>: ${total}`,
    ...byType.map(r => `• ${escapeHtml(r.type)}: ${Number(r.c)}`),
    '',
    `Last refreshed: ${ago(last[0]?.updated)}`,
    `Newest listing first seen: ${ago(last[0]?.newest)}`,
    '',
    'Run /run opportunities to refresh now.',
  ].join('\n'), { html: true })
}

function hostName(): string {
  if (process.env.VERCEL) return `Vercel (${process.env.VERCEL_ENV || 'unknown env'})`
  if (process.env.WEBSITE_SITE_NAME) return `Azure App Service (${process.env.WEBSITE_SITE_NAME})`
  return 'Unknown host'
}

export async function cmdHealth(chatId: number): Promise<void> {
  const started = Date.now()
  let db = 'OK'
  try {
    await sql`SELECT 1`
    db = `OK (${Date.now() - started} ms)`
  } catch (err) {
    db = `FAILING: ${err instanceof Error ? err.message.slice(0, 120) : 'unknown error'}`
  }

  const settings = await getAiSettings()
  const provider = resolveProvider(settings.provider)
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || ''

  await sendMessage(chatId, [
    '<b>Health</b>',
    `Database: ${escapeHtml(db)}`,
    `Host: ${escapeHtml(hostName())}`,
    `Build: ${commit ? `<code>${escapeHtml(commit.slice(0, 7))}</code>` : 'unknown'}`,
    `AI: ${provider ? `credential present (${escapeHtml(provider.provider)})` : 'no credential configured'}`,
    `Cron secret: ${process.env.CRON_SECRET ? 'set' : 'MISSING — /run will fail'}`,
  ].join('\n'), { html: true })
}

// The cron routes are imported and called in-process rather than over HTTP.
// That avoids depending on which public URL resolves to which host, and the
// route keeps doing its own CRON_SECRET check exactly as it does for GitHub
// Actions, so this adds no new way in.
async function loadCronHandler(job: CronJob): Promise<(req: NextRequest) => Promise<Response>> {
  switch (job) {
    case 'opportunities': return (await import('@/app/api/cron/opportunities/route')).POST
    case 'knowledge': return (await import('@/app/api/cron/knowledge/route')).POST
    case 'ledger': return (await import('@/app/api/cron/ledger/route')).POST
    case 'recurring-giving': return (await import('@/app/api/cron/recurring-giving/route')).POST
  }
}

export async function cmdRun(chatId: number, actor: TelegramActor, args: string): Promise<void> {
  // Same rule as the admin panel's job runner (app/api/admin/cron uses
  // directorGuard): running jobs on demand is director-only.
  if (!isDirector(actor.email)) {
    await sendMessage(chatId, 'Only the director account can run jobs on demand.')
    return
  }
  const job = args.split(/\s+/)[0]?.toLowerCase() ?? ''
  if (!isCronJob(job)) {
    await sendMessage(chatId, `Usage: /run &lt;job&gt;\nJobs: ${CRON_JOBS.join(', ')}`, { html: true })
    return
  }
  const secret = process.env.CRON_SECRET
  if (!secret) {
    await sendMessage(chatId, 'CRON_SECRET is not set on this host, so jobs cannot run.')
    return
  }

  await sendMessage(chatId, `Running <b>${escapeHtml(job)}</b>… this can take a few minutes.`, { html: true })
  await logActivity(actor, 'telegram.run_job', { targetType: 'cron', targetId: job, details: { telegramId: actor.telegramId } })

  const started = Date.now()
  try {
    const handler = await loadCronHandler(job)
    const res = await handler(new NextRequest(`http://internal/api/cron/${job}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
    }))
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    const secs = Math.round((Date.now() - started) / 1000)
    const summary = JSON.stringify(body, null, 2).slice(0, 1500)
    await sendMessage(chatId, [
      `${res.ok ? '✅' : '❌'} <b>${escapeHtml(job)}</b> ${res.ok ? 'finished' : `failed (HTTP ${res.status})`} in ${secs}s`,
      `<pre>${escapeHtml(summary)}</pre>`,
    ].join('\n'), { html: true })
  } catch (err) {
    log.error('telegram run', err, { job })
    await sendMessage(chatId, `❌ ${job} threw an error. Details are in the server logs.`)
  }
}

export async function cmdAsk(chatId: number, actor: TelegramActor, question: string): Promise<void> {
  if (!question) {
    await sendMessage(chatId, 'Usage: /ask <question>\nExample: /ask how many volunteers applied this month?')
    return
  }
  // The database agent reads every table, so it keeps its own stricter gate:
  // the master admin, plus whoever has been granted it in AI settings.
  if (!(await canUseAdminAgent(actor.email))) {
    await sendMessage(chatId, 'Your account has not been granted the database agent. The master admin can grant it under Admin → AI settings.')
    return
  }

  await sendTyping(chatId)
  // Telegram drops the typing indicator after about five seconds; keep it up
  // while the agent works through its queries.
  const typing = setInterval(() => { void sendTyping(chatId) }, 4500)
  try {
    // Audited by askAdminAgent itself in ai_agent_runs, tagged so the log
    // shows the question came from Telegram rather than the admin panel.
    const run = await askAdminAgent(`${actor.email} (telegram)`, question.slice(0, 2000))
    if (run.refused && !run.answer) {
      await sendMessage(chatId, `Could not answer: ${run.refused}`)
      return
    }
    const footer = run.queries.length ? `\n\n— ${run.queries.length} quer${run.queries.length === 1 ? 'y' : 'ies'} run` : ''
    await sendMessage(chatId, run.answer + footer)
  } finally {
    clearInterval(typing)
  }
}
