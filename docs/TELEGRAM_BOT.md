# Telegram command center

A Telegram bot that lets linked admins check on the platform and run jobs from their phone. It is a webhook route inside this app (`app/api/telegram/webhook`), so it uses the same database, admin roles, AI settings and cron handlers as the admin panel, and deploys with everything else.

## Commands

| Command | What it does |
|---|---|
| `/stats` | User count (+7 days), active learners, certificates, opportunities, and pending contact / volunteer / partner submissions and open support tickets |
| `/submissions` | The 10 newest pending submissions — **name and subject only**; bodies and email addresses stay in the admin panel |
| `/opps` | Opportunity count by type, and when listings last refreshed |
| `/health` | Database ping, which host answered (Vercel or Azure), build commit, AI credential, whether `CRON_SECRET` is set |
| `/run <job>` | **Director only**, matching the admin panel's job runner. Runs `opportunities`, `knowledge`, `ledger` or `recurring-giving` now and reports the result. Logged to `admin_activity_log` as `telegram.run_job` |
| `/ask <question>` | Asks the existing read-only database agent (`lib/admin-agent.ts`). Same access rule, monthly AI cap and `ai_agent_runs` audit as the admin panel; the actor is recorded as `<email> (telegram)` |
| `/whoami` | Your Telegram ID and the account it is linked to |
| `/help` | The list |

## Security model

1. **Webhook secret.** Every request must carry `X-Telegram-Bot-Api-Secret-Token` equal to `TELEGRAM_WEBHOOK_SECRET`, compared in constant time. Anything else gets 401.
2. **Allowlist.** Only Telegram user IDs in `TELEGRAM_ADMINS` are answered. Everyone else gets no reply at all; the attempt is logged with their ID (`ignored command from unlinked account`).
3. **Live role check.** Each Telegram ID is linked to a website account by email. On every command that account is re-read from `users`: it must exist, not be blocked, and be the master admin or hold `admin` or `editor` — the same roles `adminGuard()` admits. Trustees are not admitted: in the web app they only see sections the master admin grants. Demoting someone in the admin panel removes their bot access on their next message.
4. **`/run` and `/ask` have their own gates.** `/run` is director-only, like `app/api/admin/cron`. It requires `canUseAdminAgent()` — the master admin, or someone granted the agent under AI settings.
5. **Private chats only.** Commands sent in a group are ignored, so replies are never shown to people who were not meant to see them.
6. **Replays.** Recent `update_id`s are remembered per instance so a Telegram retry does not run a job twice.

What the bot cannot do: write or delete data, change settings, or send email. Version 1 is deliberately read-and-run only.

## Setup

### 1. Create the bot

In Telegram, message **@BotFather** → `/newbot` → pick a name and a username ending in `bot`. Copy the token. Optionally `/setjoingroups` → **Disable**, so the bot cannot be added to groups.

### 2. Generate a webhook secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 3. Set the environment variables — on both hosts

Set these on the **Vercel** project and on the **Azure** `WH-webApp` App Service, so whichever host the webhook points at is ready:

| Variable | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | From BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | From step 2 |
| `TELEGRAM_BOT_USERNAME` | The bot's username without `@` (lets `/cmd@YourBot` work) |
| `TELEGRAM_ADMINS` | Leave **empty** for now |

Do not set any of these to an empty string *and expect it to mean something*: the code treats present-but-empty as missing (same rule as the rest of this repo). Redeploy after setting them.

### 4. Point Telegram at the live domain

A bot has exactly one webhook. `www.wissenhaus.org` currently resolves to Vercel (see the note at the top of `.github/workflows/nightly-crons.yml`), so:

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
  node scripts/telegram-setup.mjs set https://www.wissenhaus.org
```

This registers the webhook and the command menu, and prints the webhook status. If production ever moves to Azure, run `set` again with the Azure URL — no code change.

### 5. Link yourself

With `TELEGRAM_ADMINS` still empty, the bot is in bootstrap mode: send it `/whoami` and it replies with your numeric ID. Then set:

```
TELEGRAM_ADMINS=123456789:wissenhaus@outlook.com
```

Use the email of your **website admin account**. Add more people as comma-separated `id:email` pairs. Redeploy (or restart), then send `/help`. Once any admin is linked, `/whoami` stops answering strangers.

## Troubleshooting

- `node scripts/telegram-setup.mjs info` shows the webhook URL, pending updates and Telegram's last delivery error.
- **401 in `last_error`** — the secret on the host differs from the one registered. Fix the env var or re-run `set`.
- **503** — `TELEGRAM_BOT_TOKEN` or `TELEGRAM_WEBHOOK_SECRET` is missing on the host that received the call.
- **No reply at all** — your ID is not in `TELEGRAM_ADMINS`, or you wrote in a group. Check the logs for `ignored command from unlinked account`.
- **"no longer has admin access"** — the linked email is not an admin account in the database.
- **`/run knowledge` reports a failure on Azure after ~230s** — the App Service front end cut the request. The job may still have finished; see "Mind the 230-second ceiling" in `docs/AZURE_DEPLOYMENT.md`.

## Six-hourly summary

Every six hours the linked admins receive a short summary in Telegram: sign-ups, new contact / volunteer / partner submissions and donations since the last summary, what is still waiting for a reply, opportunity listings and when they last refreshed, and a health line (database, host, build, AI credential).

- **Schedule:** `.github/workflows/telegram-digest.yml`, at 23 minutes past every sixth hour UTC. GitHub may start the run a few minutes late. Run it on demand from the Actions tab with *Run workflow*.
- **Endpoint:** `POST /api/cron/telegram-digest`, guarded by `CRON_SECRET`, the same secret the nightly jobs use. No new variable is needed.
- **Who gets it:** every account in `TELEGRAM_ADMINS` that still passes the live role check. Demoting someone stops their summaries on the next run.
- **What it contains:** counts and times only. No names, email addresses or message text, so a summary is safe to read on a lock screen.
- **Partial failures:** if one count can't be read it shows as `unavailable`, and the rest of the summary still sends.

To stop the summaries, disable the workflow in the Actions tab, or remove an admin from `TELEGRAM_ADMINS`.
