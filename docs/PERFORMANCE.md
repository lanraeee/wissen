# Performance Profiling

## Real-user monitoring: Vercel Speed Insights

`@vercel/speed-insights` is wired into `app/layout.tsx` (`<SpeedInsights />`, next to the existing `AnalyticsTracker`/PostHog). It automatically records Core Web Vitals (LCP, CLS, INP, FCP, TTFB) from real visitors on every deployment.

**To view it:** Vercel dashboard → the project → **Speed Insights** tab. Data only appears for the production deployment (and any deployment with the package active) — it does not report from `next dev`. Filter by page path to see which routes are slow in practice, not just in a synthetic test.

There's no code-level setup beyond what's already there — no API key, no config. If Speed Insights ever needs disabling, remove the `<SpeedInsights />` line from `app/layout.tsx`.

## Product analytics: PostHog

Already wired (`components/AnalyticsTracker.tsx`, `posthog-js`/`posthog-node`). Not a performance tool per se, but PostHog's session recordings and event timing can show *why* a page felt slow to a specific user (e.g., a slow API call blocking an interaction), which Speed Insights' aggregate numbers can't.

## Local profiling

**Lighthouse** (Chrome DevTools → Lighthouse tab, or `npx lighthouse <url> --view`): run against a **production build** (`npm run build && npm run start`), never `next dev` — dev mode is unminified and unoptimized, so its numbers are meaningless for performance work.

**React DevTools Profiler** (browser extension): use for render-performance questions — which component re-rendered, how long it took, why it happened. Most useful on interactive pages with client state (admin editors, the course quiz UI, the donation widget) rather than mostly-static marketing pages.

**Build output size** (`npm run build` output, already read throughout this session): the per-route table shows First Load JS per page and flags Static (○) vs. Dynamic (ƒ) rendering. A page that unexpectedly shows ƒ when it should be cacheable is usually a caching regression — see `docs/adr/005-revalidate-tag-caching.md` for the pattern to reach for instead of `force-dynamic`.

**Bundle composition**: `ANALYZE=true npm run build` if `@next/bundle-analyzer` is added later (not currently installed — add it only if a specific bundle-size investigation needs it, rather than by default).

## Database query performance

No query-level profiling tool is wired up. For a specific slow query, prefix it with `EXPLAIN ANALYZE` and run it directly against the Neon database (via the Neon console's SQL editor, or `psql`) rather than adding an APM layer for this — the current query patterns are simple enough that `EXPLAIN ANALYZE` on the suspect query is faster than instrumenting anything. `lib/schema.sql` documents the indexes already in place; check there first before assuming a missing index.

## What "good" looks like here

There's no formal performance budget. As a practical baseline: Core Web Vitals in the "Good" band in Speed Insights (LCP < 2.5s, CLS < 0.1, INP < 200ms) on the marketing pages (`/`, `/programmes`, `/about/story`) which are the highest-traffic, most performance-sensitive routes since they're a first impression for donors and prospective students.
