# 005 — `revalidateTag()` over `force-dynamic` for admin-edited pages

## Context
Pages that read admin-editable `site_content` (homepage, `/partner`, `/team`, `/wiki`, `/courses`) need to reflect an admin's save immediately — a stale cache showing yesterday's homepage copy after a real edit is a worse failure mode than a slightly slower request. The first pass at this (earlier in the same work session) marked each of these pages `export const dynamic = 'force-dynamic'`, which works but forces a full server render — and a fresh DB round-trip — on every single request to those pages, forever, to solve a problem that only actually occurs in the brief moment right after an edit.

## Decision
`lib/site-content.ts` wraps the `site_content` read in `unstable_cache(..., { tags: ['site-content:<key>'] })`. The generic admin content route (`app/api/admin/content/[key]/route.ts`) calls `revalidateTag('site-content:<key>')` immediately after a successful write. Pages went back to plain static generation (no `force-dynamic`).

## Consequences
- Pages are statically generated and served from cache under normal traffic — no DB hit per request.
- An admin save invalidates exactly the tag(s) it affects and the next request regenerates those pages — verified in this session's build output (all five pages returned to `○ (Static)`) and via a local production-mode (`next start`) smoke test.
- `getCourses()`/`getCourse()` additionally wrap the cached read in React's `cache()` so `generateMetadata` and the page component sharing one request only hit the cache function once.
- This pattern (`getSiteContent(key)`) is now the template for any *new* admin-editable content: use it instead of reaching for `force-dynamic` as the default fix for "my edit isn't showing up."
