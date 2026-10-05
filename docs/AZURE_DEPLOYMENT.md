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
| Image optimization | Needs `sharp` — already a dependency in `package.json` |
| Blob storage (`@vercel/blob`) | Keeps working off Vercel, but only with `BLOB_READ_WRITE_TOKEN` copied over by hand — see step 2 |

`@vercel/analytics` and `@vercel/speed-insights` also stop collecting. They fail silently and cost you nothing but bundle weight, so removing them is cleanup, not a blocker.

## Decisions up front

| Setting | Choose | Why |
|---|---|---|
| Publish | **Code** | Not Static Web Apps — this app has middleware, ~40 API routes and server components. It needs a server. |
| Runtime stack | **Node 22 LTS** | Nothing pins a version (no `engines`, no `.nvmrc`); Next 15.5 needs ≥18.18, so take the newest LTS. |
| OS | **Linux** | Windows Node hosting on App Service is a worse-supported path for Next. |
| Region | **Sweden Central** (West Europe rejected new resources on this subscription — `RequestDisallowedByAzure: locationineligible` — on 2026-10-01) | PostHog is pinned to `eu.i.posthog.com`. Match your Neon region too — every page render makes DB round-trips, so cross-continent latency compounds. |
| Plan | **B1 minimum; S1 if you want slots** | Free F1's 60 CPU-min/day quota and lack of Always On will cold-start this into the ground. Deployment slots (staging + swap, which is also your rollback) need Standard. |

Enable **Always On** once created. Without it App Service unloads the app when idle, and every first visitor pays a full Node + Next boot.

## 1. Create the App Service

**An app named `WH-webApp` already exists** — it was created through the portal, which also generated `.github/workflows/main_wh-webapp.yml` and the three `AZUREAPPSERVICE_*` federated-credential secrets the workflow logs in with. If you are working against that app, skip to step 2 and just confirm its runtime stack is `NODE|22-lts`, its startup command is `npm run start`, and Always On is enabled:

```bash
az webapp config show --name WH-webApp --resource-group Wissen-Haus-Live \
  --query "{stack:linuxFxVersion, startup:appCommandLine, alwaysOn:alwaysOn}"
```

The commands below are for provisioning from scratch. They use the live names; substitute your own if you are building a second app. Later steps reuse `$RG` and `$APP`.

```bash
RG=Wissen-Haus-Live
APP=WH-webApp
LOC=swedencentral

az group create --name $RG --location $LOC

az appservice plan create \
  --name WH-webApp-plan --resource-group $RG \
  --is-linux --sku B1

az webapp create \
  --name $APP --resource-group $RG \
  --plan WH-webApp-plan \
  --runtime "NODE|22-lts"

az webapp config set --name $APP --resource-group $RG \
  --startup-file "npm run start" \
  --always-on true \
  --http20-enabled true

az webapp update --name $APP --resource-group $RG --https-only true
```

> **2026-10-01: the plan and web app were deleted and recreated.** Recreated in the existing `Wissen-Haus-Live` resource group as `WH-webApp-plan` (B1, Linux) and `WH-webApp`, in `swedencentral` (West Europe refused new resources on this subscription — see the Region row above). The GitHub Actions workflow identifies the app by name only (no resource group in `azure/webapps-deploy@v3`), so recreating under the same name in the same subscription was enough for CI to keep working — but **App Service settings are not part of the git-tracked app**: the runtime env vars (step 2), custom domain/TLS (step 6), and anything set by hand are gone and must be redone. The Azure AD app registration behind the `AZUREAPPSERVICE_*` secrets was **also** deleted in the same cleanup (it did not survive, despite being a separate resource type) — see below for how that was rebuilt.

### Recovering GitHub's OIDC login if the app registration is gone

If a workflow run fails at the `azure/login@v2` step with `AADSTS700016: Application ... was not found in the directory`, the Azure AD app registration behind `AZUREAPPSERVICE_CLIENTID_*` no longer exists (deleted directly, or swept up in a broader cleanup — it is not part of the App Service resource and does not come back with it). Rebuild it from scratch:

```bash
# Run from Git Bash on Windows: set this first, or the leading "/subscriptions/..."
# paths below get mangled into Windows paths (e.g. "C:/Program Files/Git/subscriptions/...")
# and every command fails with a confusing "MissingSubscription" error.
export MSYS_NO_PATHCONV=1

# 1. New app registration + service principal
APP_ID=$(az ad app create --display-name "WH-webApp-github-actions-deploy" --query appId -o tsv)
az ad sp create --id "$APP_ID"

# 2. Least-privilege role: scope to just this site, not the subscription or resource group
az role assignment create \
  --assignee "$APP_ID" \
  --role "Website Contributor" \
  --scope "/subscriptions/<sub-id>/resourceGroups/Wissen-Haus-Live/providers/Microsoft.Web/sites/WH-webApp"

# 3. Federated credential trusting GitHub's OIDC issuer for this repo/branch
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<owner>/<repo>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

**The federated credential's `subject` is the part that silently breaks.** The naive `repo:<owner>/<repo>:ref:refs/heads/main` format only works if the GitHub org and repo have never been renamed. The moment either has, GitHub's actual OIDC token carries the stable numeric IDs instead: `repo:<owner>@<ownerId>/<repo>@<repoId>:ref:refs/heads/main` (for this repo: `repo:lanraeee@156936462/wissen@1310273217:ref:refs/heads/main`). A mismatch here fails differently from the missing-app-registration case — the login step still runs `az login` but fails with `AADSTS700213: No matching federated identity record found for presented assertion subject '...'`, which tells you the exact subject GitHub actually sent. Create the credential with your best guess, and if that error fires, `az ad app federated-credential update` with the subject the error message printed.

Finally, update the three GitHub secrets (`AZUREAPPSERVICE_CLIENTID_*`, `_TENANTID_*`, `_SUBSCRIPTIONID_*`, read as exact names from `.github/workflows/main_wh-webapp.yml` — tenant and subscription IDs are unchanged, only the client ID is new) and re-run the workflow.

`next start` reads the `PORT` that App Service injects, so no port configuration is needed.

**Read the default hostname, do not guess it.** Apps created since Azure introduced unique default hostnames get a name like `wh-webapp-<hash>.swedencentral-01.azurewebsites.net`, not `wh-webapp.azurewebsites.net`. Everything below that says `<azure-host>` means the value this prints:

```bash
az webapp show --name $APP --resource-group $RG --query defaultHostName -o tsv
```

## 2. Set the environment variables

**Set these before the first build.** The four `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, not read at runtime — adding them after a build bakes in `undefined` and silently kills client-side PostHog and Sentry with no error anywhere.

Twelve variables are required, plus two more if the WHF-CIO document store is used. Everything else that exists in the Vercel project is either integration-provisioned noise or platform-injected, and should not be carried over.

| Variable | Source | Notes |
|---|---|---|
| `WISSENDB_DATABASE_URL` | Vercel / Neon dashboard | Pooled connection string. `lib/db.ts` reads this first, falling back to `DATABASE_URL`. |
| `WISSENDB_DATABASE_URL_UNPOOLED` | Vercel / Neon dashboard | |
| `JWT_SECRET` | Vercel dashboard | **Copy verbatim.** A new value invalidates every `wh_token` cookie and logs out every user. |
| `CRON_SECRET` | Generate fresh | `openssl rand -hex 32`. Must match what your scheduler sends. |
| `ANTHROPIC_API_KEY` | Vercel dashboard | **Mandatory here.** `lib/ai-provider.ts` uses the AI Gateway only if `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` is set, and the OIDC token does not exist off Vercel. Without this key (or an explicit `AI_GATEWAY_API_KEY`), both the admin and support agents go dead with no deploy-time error. |
| `RESEND_API_KEY` | Vercel dashboard | |
| `STRIPE_SECRET_KEY` | Vercel dashboard | |
| `STRIPE_WEBHOOK_SECRET` | **Stripe dashboard — new value** | A new endpoint URL gets a new signing secret. The Vercel one will not verify. See step 4. |
| `FOUNDER_EMAIL` | `director@wissenhaus.org` | Admin notification recipient. Must not be an empty string — see the warning below. |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Vercel dashboard | Build-time |
| `NEXT_PUBLIC_POSTHOG_HOST` | Vercel dashboard | Build-time |
| `NEXT_PUBLIC_SITE_URL` | Set by hand | Not set on Vercel today, so the code falls back to a hardcoded `https://wissenhaus.org` in nine places. |
| `NEXT_PUBLIC_BASE_URL` | Set by hand | Same, via `lib/email.ts:393`. |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard (Storage → the Blob store) | Needed by the WHF-CIO document upload, download and delete routes. Vercel injects it automatically; off Vercel it must be copied, or uploads return 503 "File storage is not configured". |
| `WHF_BLOB_ACCESS` | Vercel dashboard | `public` or `private`, matching how the Blob store was created (`lib/whf-cio-files.ts`). Unset means `private`. |

Optional: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN` and `GOOGLE_DRIVE_FOLDER_ID` enable the WHF-CIO document backup to Google Drive (`lib/whf-cio-drive.ts`). Copy them if they are set in Vercel; without them the backup feature is simply off.

### The two URL vars matter most during testing

Left unset, your Azure instance sends password-reset links, Stripe success redirects and every receipt email pointing at **live production**. Set both to `https://<azure-host>` until you cut the domain over, then change them to the real domain and rebuild — they are build-time values, so a restart is not enough.

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

`sharp`, which Vercel provided as a platform service, is already a committed dependency in `package.json`, so image optimization works on Azure with no extra step. Keep it there: without it, `/_next/image` requests degrade or fail in self-hosted production.

### The CI workflow

`.github/workflows/main_wh-webapp.yml` was generated by the Azure portal's Deployment Center. It builds in CI, which is the right shape, but the portal's template knows nothing about Next.js and five of its defaults were wrong for this app. All five are now fixed; this section records what they were and why, because the portal will regenerate the original template if the deployment is ever re-wired through it.

**1. No build-time env — the serious one.** `npm run build` ran with no `env:` block, so every `NEXT_PUBLIC_*` variable was `undefined` when the client bundle compiled. App Service settings cannot repair this: these are inlined at build time, not read at runtime. The result was a deploy that looked completely healthy while client-side PostHog and Sentry were dead.

**2. The database URL was missing from the build too.** Less obvious, and it would have been worse. Per `docs/adr/005-revalidate-tag-caching.md` the admin-editable pages — homepage, `/partner`, `/team`, `/wiki`, `/courses` — are statically prerendered, so their `site_content` rows are read *during the build*. `lib/site-content.ts` catches DB errors and returns `null`, so a build with no connection string does not fail; it quietly bakes the hardcoded fallback copy into those pages, and they serve it until an admin edit happens to revalidate them. Vercel exposed this var to its builds, which is why it never showed up as a problem there.

**3. A missing secret is an empty string, not an absence.** `${{ secrets.FOO }}` for a secret that does not exist expands to `''`. The call sites use `??`, which only falls back on `null`/`undefined` — so an unset secret would be compiled in as a real, empty value, and `NEXT_PUBLIC_SITE_URL=''` makes every reset link and receipt URL in `lib/email.ts` root-relative and broken. That is the same shape as the `FOUNDER_EMAIL` and `CRON_SECRET` incidents. The workflow now has a **fail-fast step that refuses to build** if any of the five build inputs is missing or empty, rather than shipping a bundle that looks fine and is not.

**4. `npm install` ignored the lockfile.** Now `npm ci`. A `package-lock.json` is committed, and `docs/adr/007-vitest-version-pin.md` exists because a transitive version change broke the test run once already.

**5. `path: .` shipped `node_modules` file-by-file.** The artifact step uploaded the whole working directory — tens of thousands of small files, moved twice per deploy, once up and once down. Now the build runs `npm prune --omit=dev` and zips a single `release.zip`. `node_modules` still has to ship, because `next start` needs it at runtime and nothing rebuilds on the host, but it travels as one archive instead of a file tree.

`actions/setup-node` also moved from `@v3` to `@v4` with `cache: npm`.

### Required GitHub repository secrets

The fail-fast step means **the build will now fail until all five of these exist and are non-empty**. That is deliberate — a red build is a far better outcome than a silently broken one.

| Secret | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<azure-host>` while testing, the real domain after cutover |
| `NEXT_PUBLIC_BASE_URL` | Same |
| `NEXT_PUBLIC_POSTHOG_HOST` | From the Vercel project |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | From the Vercel project |
| `WISSENDB_DATABASE_URL` | Pooled Neon connection string |

```bash
gh secret set NEXT_PUBLIC_SITE_URL --body "https://<azure-host>"
# ...and so on for the rest
```

All five are **build inputs**, so changing any of them needs a workflow re-run, not an App Service restart. The runtime secrets from step 2 are separate and live in App Service settings.

Finally: the workflow deploys straight to `slot-name: 'Production'`. On Standard tier or above, deploy to a `staging` slot and swap instead — that is both zero-downtime and your rollback. And leave `SCM_DO_BUILD_DURING_DEPLOYMENT` unset: the package is already built, and a second build on the host would have none of these inputs.

### No migrations to run

There is no migration framework (see `docs/adr/001-neon-postgres.md`); `lib/schema.sql` is applied by hand with `node scripts/migrate.mjs`. **If the database stays on Neon, there is nothing to run** — the schema is already there. Only touch `migrate.mjs` if you are also moving the database, which is a separate project.

`instrumentation.ts` runs a schema drift check at boot. It is deliberately non-blocking and never throws, so a slow or briefly unreachable database at startup will not stop the server.

## 4. Re-point the Stripe webhook

Payments break silently if you skip this — Stripe keeps delivering to Vercel, and the Azure app never learns about completed checkouts.

1. Stripe Dashboard → Developers → Webhooks → add endpoint `https://<your-domain>/api/webhooks/stripe`
2. Subscribe to the same events the existing endpoint has
3. Copy the **new** signing secret into `STRIPE_WEBHOOK_SECRET` and restart
4. Keep the old Vercel endpoint live until cutover is verified, then delete it

## 5. Replace the crons

`vercel.json` means nothing on Azure. Two jobs need rebuilding. While Vercel is still live, its own crons keep firing too, so remove the `crons` block from `vercel.json` (or pause the Vercel project) at cutover to avoid each job running twice a night.

| Path | Schedule (UTC) | Method |
|---|---|---|
| `/api/cron/opportunities` | `17 3 * * *` | GET or POST |
| `/api/cron/knowledge` | `45 3 * * *` | GET or POST |

Both already authenticate on `Authorization: Bearer ${CRON_SECRET}`, so the replacement just has to send that header. Both export `GET` as well as `POST`, so either verb works.

**Azure-native:** a Logic App (Consumption) with a Recurrence trigger and an HTTP action, with the secret stored in Key Vault. Two tiny resources, a few cents a month.

**Zero new infrastructure:** a scheduled GitHub Actions workflow. Half of this already exists: `.github/workflows/update-opportunities.yml` calls `/api/cron/opportunities` at `17 3 * * *`, but it targets `${{ secrets.VERCEL_URL }}`, so it still hits Vercel. At cutover, point that secret (or a renamed `APP_HOST` one) at the Azure host and add the knowledge job, either as a second workflow or by replacing it with the combined one below. Timing can drift by several minutes under load, which is irrelevant for a 03:00 job.

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

`/api/cron/knowledge` declares `export const maxDuration = 300`, a Vercel-only hint. Azure App Service's load balancer closes idle HTTP connections at **230 seconds**, and that is not configurable. If the knowledge rebuild runs long, your caller gets a 502 even though the work may finish server-side — so you lose the success signal rather than the work. Watch the duration after the first few runs; if it approaches 230s, move the job to an Azure Function with a timer trigger instead of an HTTP call.

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

## Entra Domain Services (uk.wissenhaus.org) is not used

A Microsoft Entra Domain Services managed domain, `uk.wissenhaus.org`, existed in resource group `Wissen-Haus-Live`. It was deleted on 2026-10-05.

The web app does not depend on it. Checked against the repo on 2026-10-05:

- Sign-in is the app's own: bcrypt password hashes in Neon and a `jose`-signed JWT in the `wh_token` cookie (`lib/auth.ts`, `lib/auth-edge.ts`). No LDAP, Kerberos, MSAL or Entra ID library is in `package.json`.
- Nothing in `app/`, `lib/`, `components/`, `scripts/`, `middleware.ts` or `.github/workflows/` references `uk.wissenhaus.org`, LDAP or Domain Services. Every other `wissenhaus.org` reference is the public site URL or a contact email.
- No env var in [section 2](#2-set-the-environment-variables) points at it. The App Service needs no VNet integration with the managed domain's network.

The only Entra piece the deployment uses is the app registration behind GitHub's OIDC login ([section 1](#recovering-githubs-oidc-login-if-the-app-registration-is-gone)). That lives in the Entra ID tenant, not in Domain Services, and is unaffected.

**Deletion status: confirmed deleted on 2026-10-05** (reported by the owner from the Azure portal). To re-check, an empty result here means it is gone:

```bash
az resource list --resource-group Wissen-Haus-Live \
  --resource-type Microsoft.AAD/domainServices -o table
```

Domain Services can leave resources behind that are billed or block cleanup on their own: the `aadds-*` virtual network or subnet, its network security group, and any public IP or load balancer named after the domain. Delete any that remain.

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

Keep the Vercel deployment live and the DNS TTL low (300s) through cutover. Note that every push to `main` currently deploys to **both** hosts: the Vercel Git integration still builds it, and `main_wh-webapp.yml` ships it to Azure. Disconnect the Vercel Git integration once cutover is verified, and update the deploy note in `README.md` and the comments in `.github/workflows/deploy.yml`, which still say the app is deployed by Vercel. Both hosts can serve from the same Neon database simultaneously, so there is no split-brain risk in running them in parallel — the only resource that must not be double-owned is the Stripe webhook, which should point at exactly one host at a time.

Rollback is pointing DNS back at Vercel. On Standard tier and above, you also get deployment slots: deploy to `staging`, verify, then `az webapp deployment slot swap`, which makes rollback an instant swap back.

## Honest assessment

This codebase is more Vercel-coupled than its dependency list suggests — the crons, the OIDC-based AI auth, the shared-cache assumption behind ADR 005, and the two analytics packages. None of it is hard to replace, and the guide above covers all of it, but the migration buys work rather than saving it unless something specific is driving the move (cost, an Azure mandate, data-residency, or consolidating with other Azure infrastructure). Worth being clear-eyed about which of those applies before starting.
