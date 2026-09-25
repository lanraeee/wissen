# 004 — In-memory rate limiting, not Redis

## Context
Public mutating endpoints (auth, contact/partner/volunteer forms, payments) had no abuse protection. The standard production answer on Vercel is Upstash Redis + `@upstash/ratelimit`, which needs provisioning a new service and a connection string.

## Decision
Ship an in-memory, fixed-window limiter (`lib/rate-limit.ts`) keyed by `<route prefix>:<client IP>`, wired into `middleware.ts` for POST/PUT on the abuse-prone route prefixes, with per-route limits tiered by risk (tightest on auth endpoints). Zero new infrastructure, deployable immediately.

## Consequences
- **This is a known, accepted limitation, not an oversight**: state lives in the memory of whichever Vercel edge instance handles the request. Multiple regional instances each track their own count independently, so a determined attacker distributing requests across regions can exceed the nominal limit in aggregate. It's a real first line of defense against casual abuse (a script hammering one endpoint from one IP), not a hard guarantee against a distributed attack.
- The module's own comment documents the upgrade path explicitly: swap the `hit()` implementation for Upstash Redis when durable cross-instance limits are needed — no call site changes required, since `findRateLimit()`/`hit()` is the entire interface `middleware.ts` depends on.
- No persistence across deploys or restarts — a fresh instance starts with an empty rate-limit table, which is fine for this use case (abuse patterns are short-window by design).
