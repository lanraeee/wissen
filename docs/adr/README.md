# Architecture Decision Records

Short records of significant technical decisions and the reasoning behind them, so a future contributor (including future us) doesn't have to reverse-engineer *why* from the diff alone.

Format: Context (the problem/constraint), Decision (what we chose), Consequences (what that costs or unlocks). New ADRs get the next sequential number; superseding an old decision means adding a new ADR that says so, not editing the old one.

| # | Title |
|---|---|
| [001](001-neon-postgres.md) | Neon serverless Postgres as the database |
| [002](002-jwt-auth.md) | JWT + httpOnly cookie auth, no server-side session store |
| [003](003-site-content-store.md) | Generic `site_content` JSON store for admin-editable content |
| [004](004-in-memory-rate-limiting.md) | In-memory rate limiting, not Redis |
| [005](005-revalidate-tag-caching.md) | `revalidateTag()` over `force-dynamic` for admin-edited pages |
| [006](006-zod-validation.md) | Zod + shared `parseBody()` helper for request validation |
| [007](007-vitest-version-pin.md) | Vitest pinned to 2.x |
| [008](008-career-fair-assessment-link.md) | Career Fair booth recommendations: localStorage snapshot, not account-linked |
