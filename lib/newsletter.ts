import crypto from 'crypto'
import sql from './db'

export function generateUnsubscribeToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export interface BroadcastCandidate {
  name: string
  email: string
}

export interface BroadcastRecipient {
  name: string
  email: string
  unsubscribe_token: string
}

/**
 * Turns a raw candidate list (from recurring_pledges, the users table,
 * wherever) into the actual send list for a broadcast: every candidate is
 * upserted into newsletter_subscribers (so it has an unsubscribe token and
 * is covered by the same bounce/complaint suppression every other send
 * uses -- see app/api/webhooks/resend), then the result is filtered back
 * down to status = 'subscribed'. ON CONFLICT DO NOTHING means an address
 * that's already unsubscribed/bounced/complained is never silently
 * resubscribed just because it showed up in a new candidate list again.
 */
export async function resolveBroadcastAudience(
  candidates: BroadcastCandidate[],
  source: string
): Promise<BroadcastRecipient[]> {
  const byEmail = new Map<string, string>()
  for (const c of candidates) {
    const email = c.email.trim().toLowerCase()
    if (email && !byEmail.has(email)) byEmail.set(email, c.name)
  }
  if (byEmail.size === 0) return []

  for (const [email, name] of byEmail) {
    await sql`
      INSERT INTO newsletter_subscribers (email, name, source, unsubscribe_token)
      VALUES (${email}, ${name || null}, ${source}, ${generateUnsubscribeToken()})
      ON CONFLICT (email) DO NOTHING
    `
  }

  const emails = Array.from(byEmail.keys())
  const rows = await sql`
    SELECT name, email, unsubscribe_token FROM newsletter_subscribers
    WHERE status = 'subscribed' AND email = ANY(${emails})
  `
  return rows.map(r => ({ name: (r.name as string) || '', email: r.email as string, unsubscribe_token: r.unsubscribe_token as string }))
}

/** Resend rate-limits at roughly 2 req/sec on the plans this project uses. */
export async function sendInBatches<T>(items: T[], batchSize: number, send: (item: T) => Promise<unknown>) {
  let sent = 0
  let failed = 0
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const results = await Promise.allSettled(batch.map(send))
    for (const r of results) {
      if (r.status === 'fulfilled') sent++
      else failed++
    }
    if (i + batchSize < items.length) await new Promise(r => setTimeout(r, 1000))
  }
  return { sent, failed }
}
