# 003 — Generic `site_content` JSON store for admin-editable content

## Context
The site accumulated many independent pieces of admin-editable content over time — team members, founder bio, homepage hero copy, partner logos, courses, bank transfer details, WhatsApp channel info, careers listings, policy timeline, and more. Each has its own shape and its own admin editor UI, but they're all "one blob of JSON, keyed by name, read by public pages and written by an admin form."

## Decision
One table, `site_content (key TEXT PRIMARY KEY, value JSONB, updated_at)`, and one generic route, `app/api/admin/content/[key]/route.ts` (GET/PUT), used by every admin content editor. `PUT` is bounded to 500KB of JSON per key (a sanity cap, not a real limit for any current use) and requires `adminGuard()`, except `bank_transfer_details` which requires `directorGuard()` specifically (see the route's own comment — it holds the bank account donors are told to pay into).

Each consumer defines its own TypeScript shape for its key (`HeroContent`, `TeamMember[]`, `Course[]`, etc.) and owns its own fallback default if the key doesn't exist yet.

## Consequences
- Adding a new admin-editable content area needs zero new API routes or database migrations — just a `key` name, a TypeScript interface, an admin editor component, and a public-page reader. This is why Partners, Homepage Hero, and Courses were each added in well under an hour during this session.
- No schema validation at the database level — a key's shape is only as correct as the Zod-free `value: unknown` check at the API boundary (size-capped, not shape-checked) and whatever the reading page defensively does with `Partial<T>` + spread-over-defaults.
- No relational integrity between keys — e.g. `courses`' course IDs and `certificates.course_id` are just matching strings, not a foreign key (see ADR on the courses migration in the git history for how that was handled safely).
- Every write goes through `revalidateTag('site-content:<key>')` (see ADR 005) so reads stay cached without going stale after an edit.
