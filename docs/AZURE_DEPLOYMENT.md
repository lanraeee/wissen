# Deploying to Azure App Service

Runbook for hosting this app on Azure App Service (Linux) instead of Vercel. Written against the state of the repo at the time of the move; the env-var list is derived from every `process.env.*` read in `app/`, `lib/`, `components/`, `scripts/`, `middleware.ts`, `instrumentation*.ts` and `sentry.*.ts`.

Read the **[Scale-out trap](#the-scale-out-trap-read-this-before-scaling)** section before you set the instance count above 1. It is the one failure mode that is silent, user-visible, and specific to leaving Vercel.

## What actually changes

The app itself is portable — Next.js 15 with `next start` is a plain Node server, and Neon is reachable from anywhere. What you lose is four platform services that the code currently assumes:

| Was provided by Vercel | On Azure |
|---|---|
| Cron scheduling (`vercel.json`) | Must be rebuilt — see [Replace the crons](#5-replace-the-crons) |
| `VERCEL_OIDC_TOKEN` for the AI Gateway | Gone; `ANTHROPIC_API_KEY` becomes mandatory |
| Shared data cache across instances | Per-instance only — the scale-out trap |
| Image optimization | Needs `sharp` installed locally |

`@vercel/analytics` and `@vercel/speed-insights` also stop collecting. They fail silently and cost you nothing but bundle weight, so removing them is cleanup, not a blocker.

## Decisions up front

| Setting | Choose | Why |
|---|---|---|
| Publish | **Code** | Not Static Web Apps — this app has middleware, ~40 API routes and server components. It needs a server. |
| Runtime stack | **Node 22 LTS** | Nothing pins a version (no `engines`, no `.nvmrc`); Next 15.5 needs ≥18.18, so take the newest LTS. |
| OS | **Linux** | Windows Node hosting on App Service is a worse-supported path for Next. |
| Region | **West Europe / Sweden Central** | PostHog is pinned to `eu.i.posthog.com`. Match your Neon region too — every page render makes DB round-trips, so cross-continent latency compounds. |
| Plan | **B1 minimum; S1 if you want slots** | Free F1's 60 CPU-min/day quota and lack of Always On will cold-start this into the ground. Deployment slots (staging + swap, which is also your rollback) need Standard. |

Enable **Always On** once created. Without it App Service unloads the app when idle, and every first visitor pays a full Node + Next boot.

## 1. Create the App Service

```bash
RG=wissen-haus-rg
APP=wissen-haus
LOC=westeurope

az group create --name $RG --location $LOC

az appservice plan create \
  --name wissen-haus-plan --resource-group $RG \
  --is-linux --sku B1

az webapp create \
  --name $APP --resource-group $RG \
  --plan wissen-haus-plan \
  --runtime "NODE|22-lts"

az webapp config set --name $APP --resource-group $RG \
  --startup-file "npm run start" \
  --always-on true \
  --http20-enabled true

az webapp update --name $APP --resource-group $RG --https-only true
```

`next start` reads the `PORT` that App Service injects, so no port configuration is needed.

## 2. Set the environment variables

**Set these before the first build.** The four `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, not read at runtime — adding them after a build bakes in `undefined` and silently kills client-side PostHog and Sentry with no error anywhere.

Thirteen variables are required. Everything else that exists in the Vercel project is either integration-provisioned noise or platform-injected, and should not be carried over.

| Variable | Source | Notes |
|---|---|---|
| `WISSENDB_DATABASE_URL` | Vercel / Neon dashboard | Pooled connection string. `lib/db.ts` reads this first, falling back to `DATABASE_URL`. |
| `WISSENDB_DATABASE_URL_UNPOOLED` | Vercel / Neon dashboard | |
| `JWT_SECRET` | Vercel dashboard | **Copy verbatim.** A new value invalidates every `wh_token` cookie and logs out every user. |
| `CRON_SECRET` | Generate fresh | `openssl rand -hex 32`. Must match what your scheduler sends. |
| `ANTHROPIC_API_KEY` | Vercel dashboard | **Mandatory here.** `lib/ai-provider.ts` falls back to `VERCEL_OIDC_TOKEN`, which does not exist off Vercel — without this, both the admin and support agents go dead with no deploy-time error. |
| `RESEND_API_KEY` | Vercel dashboard | |
| `STRIPE_SECRET_KEY` | Vercel dashboard | |
| `STRIPE_WEBHOOK_SECRET` | **Stripe dashboard — new value** | A new endpoint URL gets a new signing secret. The Vercel one will not verify. See step 4. |
| `FOUNDER_EMAIL` | `director@wissenhaus.org` | Admin notification recipient. Must not be an empty string — see the warning below. |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Vercel dashboard | Build-time |
| `NEXT_PUBLIC_POSTHOG_HOST` | Vercel dashboard | Build-time |
| `NEXT_PUBLIC_SITE_URL` | Set by hand | Not set on Vercel today, so the code falls back to a hardcoded `https://wissenhaus.org` in nine places. |
| `NEXT_PUBLIC_BASE_URL` | Set by hand | Same, via `lib/email.ts:385`. |

### The two URL vars matter most during testing

Left unset, your Azure instance sends password-reset links, Stripe success redirects and every receipt email pointing at **live production**. Set both to the Azure hostname (`https://wissen-haus.azurewebsites.net`) until you cut the domain over, then change them to the real domain and rebuild — they are build-time values, so a restart is not enough.

### Never set a variable to an empty string

This project has been bitten twice by an env var that was *present but empty*. `lib/db.ts` and the `NEXT_PUBLIC_SITE_URL` call sites use `??`, which only falls back on `null`/`undefined` — an empty string passes straight through and resolves to `''`. Both cron routes guard with `if (!cronSecret)`, so an empty `CRON_SECRET` makes `/api/cron/knowledge` return 401 and `/api/cron/opportunities` return 500 on every run. Verify values, not just key presence.

```bash
# Write azure-settings.json first — do not commit it.
az webapp config appsettings set \
  --name $APP --resource-group $RG \
  --settings @azure-settings.json
```

## 3. Build and deploy

The build is self-contained. `prebuild` runs `scripts/generate-schema-snapshot.mjs`, which only reads `lib/schema.sql` and writes a `.ts` file — no database connection — so the build will not fail on a host without DB access.

Install `sharp`, which Vercel provided as a platform service:

```bash
npm install sharp
```

### GitHub Actions

Building in CI rather than letting Oryx build on the host is the better path: you control the Node version, and `NEXT_PUBLIC_*` values come from GitHub secrets at the moment the bundle is produced.

```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
          NEXT_PUBLIC_BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}
          NEXT_PUBLIC_POSTHOG_HOST: ${{ secrets.NEXT_PUBLIC_POSTHOG_HOST }}
          NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: ${{ secrets.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN }}
      - uses: azure/webapps-deploy@v3
        with:
          app-name: wissen-haus
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

If you instead deploy a zip and want Oryx to build on the host, set `SCM_DO_BUILD_DURING_DEPLOYMENT=true` as an app setting.

### No migrations to run

There is no migration framework (see `docs/adr/001-neon-postgres.md`); `lib/schema.sql` is applied by hand with `node scripts/migrate.mjs`. **If the database stays on Neon, there is nothing to run** — the schema is already there. Only touch `migrate.mjs` if you are also moving the database, which is a separate project.

`instrumentation.ts` runs a schema drift check at boot. It is deliberately non-blocking and never throws, so a slow or briefly unreachable database at startup will not stop the server.

## 4. Re-point the Stripe webhook

Payments break silently if you skip this — Stripe keeps delivering to Vercel, and the Azure app never learns about completed checkouts.

1. Stripe Dashboard → Developers → Webhooks → add endpoint `https://<your-domain>/api/payments/stripe/webhook`
2. Subscribe to the same events the existing endpoint has
3. Copy the **new** signing secret into `STRIPE_WEBHOOK_SECRET` and restart
4. Keep the old Vercel endpoint live until cutover is verified, then delete it

## 5. Replace the crons

`vercel.json` means nothing on Azure. Two jobs need rebuilding:

| Path | Schedule (UTC) | Method |
|---|---|---|
| `/api/cron/opportunities` | `17 3 * * *` | GET or POST |
| `/api/cron/knowledge` | `45 3 * * *` | GET or POST |

Both already authenticate on `Authorization: Bearer ${CRON_SECRET}`, so the replacement just has to send that header. Both export `GET` as well as `POST`, so either verb works.

**Azure-native:** a Logic App (Consumption) with a Recurrence trigger and an HTTP action, with the secret stored in Key Vault. Two tiny resources, a few cents a month.

**Zero new infrastructure:** a scheduled GitHub Actions workflow. Timing can drift by several minutes under load, which is irrelevant for a 03:00 job.

```yaml
name: Scheduled jobs
on:
  schedule:
    - cron: '17 3 * * *'
    - cron: '45 3 * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          if [ "${{ github.event.schedule }}" = "17 3 * * *" ]; then
            PATH_=opportunities
          else
            PATH_=knowledge
          fi
          curl -fsS -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://${{ secrets.APP_HOST }}/api/cron/$PATH_"
```

### Mind the 230-second ceiling

Both cron routes declare `export const maxDuration = 300`, a Vercel-only hint. Azure App Service's load balancer closes idle HTTP connections at **230 seconds**, and that is not configurable. If the knowledge rebuild runs long, your caller gets a 502 even though the work may finish server-side — so you lose the success signal rather than the work. Watch the duration after the first few runs; if it approaches 230s, move the job to an Azure Function with a timer trigger instead of an HTTP call.

## 6. Custom domain and TLS

```bash
az webapp config hostname add \
  --webapp-name $APP --resource-group $RG \
  --hostname www.wissenhaus.org

az webapp config ssl create \
  --name $APP --resource-group $RG \
  --hostname www.wissenhaus.org
```

The managed certificate is free and auto-renews, but requires the DNS record to resolve to the app first. Add the CNAME and the `asuid.` TXT verification record, confirm propagation, then request the cert.

After the domain is live, update `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BASE_URL` to the real domain and **rebuild** — these are compiled into the bundle, so a restart will not pick them up.

## The scale-out trap (read this before scaling)

**Keep the instance count at 1 unless you do the work described here.**

`docs/adr/005-revalidate-tag-caching.md` is built on `unstable_cache` plus `revalidateTag`: admin-editable pages (homepage, `/partner`, `/team`, `/wiki`, `/courses`) are statically cached, and the admin content route calls `revalidateTag('site-content:<key>')` after a write so an edit appears immediately.

On Vercel, that cache is shared infrastructure, so the invalidation reaches every instance. With self-hosted `next start`, **the cache is per-instance**. Scale to two instances and an admin's save invalidates only the instance that happened to handle the POST; the other keeps serving yesterday's copy until it restarts. That is precisely the failure mode ADR 005 exists to prevent, and it reappears the moment you scale out — intermittently, depending on which instance a visitor lands on, which makes it miserable to diagnose.

Two honest options:

1. **Stay on one instance.** Scale up (bigger B/S tier) rather than out. Entirely reasonable at this traffic level.
2. **Add a shared cache handler.** Set `cacheHandler` in `next.config.mjs` pointing at a Redis-backed implementation (Azure Cache for Redis). This is a real change with its own failure modes — do it deliberately, not as a side effect of enabling autoscale.

A related but **pre-existing** limitation: `lib/rate-limit.ts` is in-memory and per-instance by design (`docs/adr/004-in-memory-rate-limiting.md` accepts this explicitly, since Vercel instances were already independent). Scaling out dilutes the limits proportionally — it is not a regression, but if you move to multiple instances, the Upstash Redis upgrade path documented in that ADR becomes more attractive. The module's `hit()`/`findRateLimit()` interface is the only thing `middleware.ts` depends on, so the swap needs no call-site changes.

## Sentry is currently inert

`@sentry/nextjs` v11 is fully wired — `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` — but no DSN is set in the Vercel project, so nothing is reporting today. The configs are written to be no-ops without a DSN, so this is harmless.

If you want error reporting on Azure (and this is a good moment for it, since you lose Vercel's runtime logs view), set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`, plus `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` at build time for source map upload. That is a separate decision from the migration — just be aware you are not losing something you currently have.

## Verification checklist

Work through this against the Azure hostname before cutting DNS over.

- [ ] Home page renders; no console errors
- [ ] PostHog events arriving (check Live Events — proves the build-time vars were set correctly)
- [ ] Sign in, reload, still signed in (`JWT_SECRET` correct, cookie flags fine over HTTPS)
- [ ] Password reset email arrives, **and its link points at the Azure host, not production**
- [ ] A Stripe test checkout completes and the webhook is received (Stripe Dashboard → webhook attempts)
- [ ] Admin content edit appears on the public page immediately (`revalidateTag` path)
- [ ] Admin or support agent returns an answer (proves `ANTHROPIC_API_KEY`)
- [ ] `curl -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/cron/knowledge` returns 200, not 401/500
- [ ] Same for `/api/cron/opportunities`
- [ ] An optimized `/_next/image` URL returns a transformed image (proves `sharp`)
- [ ] App Service log stream shows the schema drift check passing at boot

## Cutover and rollback

Keep the Vercel deployment live and the DNS TTL low (300s) through cutover. Both hosts can serve from the same Neon database simultaneously, so there is no split-brain risk in running them in parallel — the only resource that must not be double-owned is the Stripe webhook, which should point at exactly one host at a time.

Rollback is pointing DNS back at Vercel. On Standard tier and above, you also get deployment slots: deploy to `staging`, verify, then `az webapp deployment slot swap`, which makes rollback an instant swap back.

## Honest assessment

This codebase is more Vercel-coupled than its dependency list suggests — the crons, the OIDC-based AI auth, the shared-cache assumption behind ADR 005, and the two analytics packages. None of it is hard to replace, and the guide above covers all of it, but the migration buys work rather than saving it unless something specific is driving the move (cost, an Azure mandate, data-residency, or consolidating with other Azure infrastructure). Worth being clear-eyed about which of those applies before starting.
