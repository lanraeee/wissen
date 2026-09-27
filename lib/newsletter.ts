import crypto from 'crypto'

export function generateUnsubscribeToken() {
  return crypto.randomBytes(24).toString('base64url')
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
