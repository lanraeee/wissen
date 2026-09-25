// In-memory, fixed-window rate limiter for Edge Middleware.
//
// Limitation: state lives in the memory of whichever edge instance handles
// the request. Vercel's Edge Network runs many regional instances, so a
// determined attacker distributing requests across regions/instances can
// exceed these limits in aggregate — this is a best-effort first line of
// defense, not a hard guarantee. For durable, cross-instance limits, swap
// this store for Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`),
// which is the standard approach on Vercel and needs only a Redis
// connection string in env vars — no other code here would need to change
// beyond the `hit()` implementation.
const buckets = new Map<string, { count: number; resetAt: number }>()

// Periodic cleanup so `buckets` doesn't grow unbounded over the life of an
// instance. Cheap: only runs when a new key is inserted.
let lastSweep = Date.now()
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/** Records a hit for `key` and reports whether it's within `limit` per `windowMs`. */
export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  existing.count += 1
  return { ok: existing.count <= limit, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt }
}

export function clientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

// Path-prefix -> {limit, windowMs}. First matching prefix wins; unmatched
// paths under /api are not rate limited by this table.
export const RATE_LIMITS: Array<{ prefix: string; limit: number; windowMs: number }> = [
  // Brute-force / account-abuse surfaces — tightest limits.
  { prefix: '/api/auth/login', limit: 10, windowMs: 15 * 60_000 },
  { prefix: '/api/auth/signup', limit: 5, windowMs: 60 * 60_000 },
  { prefix: '/api/auth/forgot-password', limit: 5, windowMs: 60 * 60_000 },
  { prefix: '/api/auth/reset-password', limit: 10, windowMs: 60 * 60_000 },
  // Spam-prone public forms.
  { prefix: '/api/contact', limit: 5, windowMs: 10 * 60_000 },
  { prefix: '/api/partner', limit: 5, windowMs: 10 * 60_000 },
  { prefix: '/api/volunteer', limit: 5, windowMs: 10 * 60_000 },
  { prefix: '/api/submissions', limit: 10, windowMs: 10 * 60_000 },
  // Payments — generous enough for legitimate retries, still bounded.
  { prefix: '/api/payments', limit: 20, windowMs: 10 * 60_000 },
  // Logged-in community actions — abuse-resistant but not restrictive.
  { prefix: '/api/forum', limit: 30, windowMs: 10 * 60_000 },
  { prefix: '/api/testimonials', limit: 10, windowMs: 10 * 60_000 },
]

export function findRateLimit(pathname: string) {
  return RATE_LIMITS.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
}
