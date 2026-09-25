# 006 — Zod + shared `parseBody()` helper for request validation

## Context
API routes had inconsistent, hand-rolled validation — some checked `typeof` and string length manually (contact/partner/volunteer), most checked nothing beyond "is this field truthy." That's both a correctness gap (unbounded string lengths landing in the database) and a maintenance cost (the same email-regex/length-check logic copy-pasted per route).

## Decision
Standardize on Zod for every route that takes a body. `lib/validation.ts` exports common field schemas (`zEmail`, `zName`, `zShortText`, `zMessage`, `zLongText`) and a `parseBody(req, schema)` helper that returns `{ data }` on success or `{ error: NextResponse }` (a ready-to-return 400) on failure — including malformed JSON, which previously threw an unhandled exception in a couple of routes.

Admin routes got the same treatment even though they're behind `adminGuard()`/`directorGuard()` — trusted-user input still benefits from consistent bounds (an admin's browser extension or a compromised session shouldn't be able to write arbitrarily large blobs).

## Consequences
- Every route's validation is declarative and lives next to the route it validates, not scattered across shared "form utils."
- One exception, deliberately: `app/api/admin/content/[key]/route.ts` validates `value` as `z.unknown()` with only a size cap, not a shape — see ADR 003 for why (the shape is intentionally per-key and owned by each content editor, not the generic route).
- `app/api/webhooks/stripe/route.ts` is **not** Zod-validated — its payload is verified by Stripe's own HMAC signature, which is a stronger guarantee than a shape check would add, so adding Zod there would be redundant.
