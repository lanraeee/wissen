# API Reference

Internal reference for the routes under `app/api/`. All request/response bodies are JSON unless noted. Error responses are always `{ "error": string }` with a non-2xx status.

Auth levels referenced below:
- **Public** — no session required.
- **Session** — requires a signed-in user (`wh_token` cookie).
- **Admin** — session with `role` of `editor`, `admin`, or `director` (`adminGuard()`).
- **Director** — session with `role: 'director'` specifically (`directorGuard()` / `isDirector()`).

Validation: routes marked **Zod** parse their body with a schema via `lib/validation.ts`'s `parseBody()` and return `400` with a field-specific message on failure. Routes not marked Zod either take no body or are internal/admin routes with lighter checks.

Rate limiting: public mutating routes are limited per-IP by `middleware.ts` (see `lib/rate-limit.ts`) — exceeding the window returns `429` with `Retry-After`.

---

## Auth — `/api/auth/*`

### `POST /api/auth/signup` — Public, Zod
Body: `{ firstName, lastName, email, password }` (password min 8 chars).
`201`-equivalent (`200`) response: `{ success: true, user: { id, email, name } }`, sets `wh_token` cookie. `409` if the email is already registered.

### `POST /api/auth/login` — Public, Zod
Body: `{ email, password }`.
Response: `{ success: true, user: { id, email, name } }`, sets `wh_token` cookie. `401` with a generic "Invalid email or password" for both unknown email and wrong password (no user enumeration). Also upserts a daily visit-streak row.

### `POST /api/auth/logout` — Public
No body. Clears the `wh_token` cookie. Response: `{ success: true }`.

### `GET /api/auth/me` — Session
Response: `{ user: UserPayload }` from the verified JWT, or `{ user: null }` if not signed in.

### `POST /api/auth/forgot-password` — Public, Zod
Body: `{ email }`. Always responds `{ success: true }` regardless of whether the account exists (anti-enumeration). Emails a reset link if it does.

### `POST /api/auth/reset-password` — Public, Zod
Body: `{ token, password }` (password min 8 chars). `400` if the token is invalid/expired/used. Response: `{ success: true }`.

---

## Public forms — `/api/contact`, `/api/partner`, `/api/volunteer`, `/api/submissions`, `/api/testimonials`

### `POST /api/contact` — Public, Zod
Body: `{ name, email, subject, message }`. Inserts a `submissions` row (`type: 'contact'`), emails the admin + a confirmation to the sender (best-effort — failure doesn't fail the request). Response: `{ success: true }`.

### `POST /api/partner` — Public, Zod
Body: `{ name, email, organisation, message? }`. Same pattern as contact (`type: 'partner'`).

### `POST /api/volunteer` — Public, Zod
Body: `{ name, email, role, message? }`. Same pattern (`type: 'volunteer'`).

### `POST /api/submissions` — Public, Zod
Generic fallback submission endpoint. Body: `{ type, name, email, phone?, ...arbitrary }` — `type` is a free-text string (not an enum), extra fields are stored as-is in `data` JSONB (size-capped at 20KB). Response: `{ success: true }`.

### `GET /api/testimonials` — Public
Response: `{ testimonials: Testimonial[] }` — up to 24 approved testimonials, featured first.

### `POST /api/testimonials` — Session, Zod
Body: `{ quote, role? }` (quote max 1000 chars). Creates a `pending` testimonial under the caller's name, notifies the admin. `201` response: `{ testimonial }`.

---

## Courses — `/api/courses/[courseId]/progress`

### `GET /api/courses/[courseId]/progress` — Session
Response: `{ completedModules: { module_id, completed_at }[], certificate: { certificate_id, issued_at } | null }`.

### `POST /api/courses/[courseId]/progress` — Session, Zod
Body: `{ moduleId: number }`. Marks the module complete (idempotent). If this completes every module in the course, issues a certificate. Response: `{ success: true, certificateAwarded: boolean, certificateId?: string }`.

---

## Community forum — `/api/forum/threads*`

### `GET /api/forum/threads` — Public
Query: `?tag=<Tag>&page=<n>`. Response: `{ threads: Thread[], total: number, page: number, limit: 20 }`.

### `POST /api/forum/threads` — Session, Zod
Body: `{ title, body, tag? }` (tag falls back to `'Discussion'` if not one of the known tags). `201` response: the created thread.

### `GET /api/forum/threads/[id]` — Public
Response: the thread row, or `404`.

### `DELETE /api/forum/threads/[id]` — Session (admin/director only)
Response: `{ success: true }`.

### `GET /api/forum/threads/[id]/replies` — Public
Response: `Reply[]` (array, not wrapped), oldest first.

### `POST /api/forum/threads/[id]/replies` — Session, Zod
Body: `{ body }` (max 2000 chars). `404` if the thread doesn't exist. `201` response: the created reply; increments the thread's `reply_count`.

---

## Opportunities — `/api/opportunities`

### `GET /api/opportunities` — Public
Query: `?type=<jobs|internships|scholarships|competitions>&local=1`. Response: `{ opportunities: Opportunity[] }`, unexpired only, newest first (capped at 100–200 rows depending on filter). Returns `{ opportunities: [] }` with `500` on failure rather than erroring the caller.

---

## Analytics — `/api/analytics/track`

### `POST /api/analytics/track` — Public, Zod
Body: `{ pathname, referrer?, session_id?, utm_source?, utm_medium?, utm_campaign? }`. Ignores `/admin/*` paths. Derives device/browser/country/city from headers server-side. Response: `{ ok: true }` (or `{ ok: false }` on validation/server failure — never throws to the caller).

---

## Payments — `/api/payments/*`

### `POST /api/payments/stripe` — Public, Zod
Body: `{ amount, currency?, name?, email, callbackUrl? }`. `callbackUrl`, if given, must share the site's own origin (or the requesting host, for preview deployments) — otherwise it's ignored, closing an open-redirect gap. Creates a Stripe Checkout session. Response: `{ url: string }` (redirect target), or `503` if Stripe isn't configured.

### `PUT /api/payments/stripe` — Public, Zod
Body: `{ sessionId }`. Verifies a completed Checkout session and records the donation (idempotent). Response: `{ success: true, amount, currency }`.

### `POST /api/payments/bank-transfer` — Public, Zod
Body: `{ amount, currency: 'NGN'|'USD'|'GBP'|'EUR', name, email, message? }`. Records a pledge (not yet a donation — no certificate/receipt issued), emails account details to the donor. `201` response: `{ reference, url }`.

### `PUT /api/payments/bank-transfer` — Public, Zod
Body: `{ reference }`. Donor declaring "I've sent it" — advisory only, does not issue a receipt. Response: `{ status }`.

### `POST /api/webhooks/stripe` — Public (Stripe-signature verified)
Raw body, verified via `stripe-signature` header + `STRIPE_WEBHOOK_SECRET`. Records the donation on `checkout.session.completed`, idempotently. Returns `5xx` on failure so Stripe retries.

---

## Cron — `/api/cron/opportunities`, `/api/admin/cron`

### `POST /api/cron/opportunities` — `Authorization: Bearer <CRON_SECRET>`
Scrapes RemoteOK, WeWorkRemotely, Himalayas, Arbeitnow, Devpost, and a scholarships source; upserts into `opportunities`. Not user-facing.

### `POST /api/admin/cron` — Session (director email only)
Manually triggers the above via an internal fetch with `CRON_SECRET` attached. Response: whatever `/api/cron/opportunities` returned.

---

## Admin — `/api/admin/*` (all require `adminGuard()` unless noted)

### Content
- `GET /api/admin/content/[key]` — reads one `site_content` row: `{ value }`. `bank_transfer_details` requires **Director**.
- `PUT /api/admin/content/[key]` — Zod (generic, size-capped at 500KB). Upserts the row and calls `revalidateTag('site-content:<key>')` so public pages reflect the change immediately. `bank_transfer_details` requires **Director**.

  This is the generic store behind Homepage Hero, Partners, Team Members, Founder Bio, Courses, and most other `/admin/content` tabs — the shape of `value` is owned by whichever admin editor writes it.

### Users
- `GET /api/admin/users` — `{ users: User[] }` with course/cert counts (single JOIN, not N+1).
- `PATCH /api/admin/users/[id]` — body `{ action: 'grant_premium'|'revoke_premium'|'update'|'set_role', ... }`. Director-only when the target is the director's own record; `set_role` and similar sensitive actions are further gated (see the route's own comments).
- `DELETE /api/admin/users/[id]`.

### Submissions
- `GET /api/admin/submissions` — query `?type=`, response `{ submissions: [] }`.
- `PATCH /api/admin/submissions/[id]` — body `{ status }`.
- `DELETE /api/admin/submissions/[id]`.
- `DELETE /api/admin/submissions` (bulk, see route for body shape).

### Donation projects — `/api/admin/donation-projects`
- `GET` — `{ projects: [] }`.
- `POST` — Zod. `201` `{ project }`.
- `PUT` — Zod (partial update by `id`). `{ project }`.
- `DELETE` — Zod `{ id }`. `{ ok: true }`.

### Opportunities (manual entries) — `/api/admin/opportunities`
- `POST` — Zod. `{ success: true, id }`.
- `GET /api/admin/opportunities/[id]`, `PUT` — Zod, `DELETE`.

### Testimonials — `/api/admin/testimonials`
- `GET` — `{ testimonials: [] }` (all, any status).
- `POST` — Zod. `201` `{ testimonial }`.
- `PUT` — Zod (partial update by `id`). `{ testimonial }`.
- `DELETE` — Zod `{ id }`. `{ ok: true }`.

### Certificates
- `POST /api/admin/certificates` — Zod `{ email, courseId, markComplete? }`. Issues a certificate (optionally marking all modules complete first via a single bulk insert). `{ success: true, certificateId, alreadyExisted }`.
- `DELETE /api/admin/certificates/[id]`.

### Bank transfers — `/api/admin/bank-transfers`
- `GET` — `{ pledges: [] }`.
- `POST` — Zod `{ reference }`. Confirms a pledge landed: issues the real receipt + certificate (idempotent). `{ success: true, certId, certUrl }`.
- `DELETE` — Zod `{ reference }`. Cancels a pledge.

### Donations
- `POST /api/admin/donations/resend-receipt` — Zod `{ reference }`. Re-sends the receipt email for an already-recorded donation.

### Misc reads
- `GET /api/admin/stats` — dashboard counters.
- `GET /api/admin/courses-data` — courses-related aggregate data for the admin courses page.

---

## Notes on shapes not covered above
Several admin routes (donation-projects, opportunities, testimonials) share nearly identical CRUD shapes — see `lib/validation.ts` and the route file itself for the exact Zod schema, which is the authoritative contract.
