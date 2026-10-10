// Registers the Telegram webhook and command menu for the command center.
//
// Usage (from the repo root):
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
//     node scripts/telegram-setup.mjs set https://www.wissenhaus.org
//   TELEGRAM_BOT_TOKEN=... node scripts/telegram-setup.mjs info
//   TELEGRAM_BOT_TOKEN=... node scripts/telegram-setup.mjs delete
//
// A bot has exactly ONE webhook. Point it at whichever host serves the public
// domain (www.wissenhaus.org resolves to Vercel today). The route also exists
// on the Azure deployment, so switching hosts is re-running `set` with the
// other URL -- no code change.
//
// Run `set` again whenever TELEGRAM_WEBHOOK_SECRET changes: Telegram stores
// the secret and the app checks every request against it.

const [mode = 'info', baseUrl] = process.argv.slice(2)
const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set.')
  process.exit(1)
}

// Kept in step with HELP_TEXT in lib/telegram-shared.ts.
const COMMANDS = [
  { command: 'stats', description: 'Users, learners and pending submissions' },
  { command: 'submissions', description: 'Latest pending form submissions' },
  { command: 'opps', description: 'Opportunity listings and last refresh' },
  { command: 'health', description: 'Database, host, build and AI status' },
  { command: 'run', description: 'Run a job: opportunities, knowledge, ledger, recurring-giving' },
  { command: 'ask', description: 'Ask the database agent a question' },
  { command: 'whoami', description: 'Your Telegram ID and linked account' },
  { command: 'help', description: 'List commands' },
]

async function api(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`${method}: ${data.description ?? res.status}`)
  return data.result
}

if (mode === 'set') {
  if (!baseUrl || !/^https:\/\//.test(baseUrl)) {
    console.error('Give the public https base URL, e.g. https://www.wissenhaus.org')
    process.exit(1)
  }
  if (!secret || !/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    console.error('TELEGRAM_WEBHOOK_SECRET must be 16-256 characters of A-Z, a-z, 0-9, _ or -.')
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"')
    process.exit(1)
  }
  const url = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`
  await api('setWebhook', {
    url,
    secret_token: secret,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })
  await api('setMyCommands', { commands: COMMANDS })
  const me = await api('getMe')
  console.log(`Webhook set to ${url}`)
  console.log(`Bot: @${me.username} -- set TELEGRAM_BOT_USERNAME=${me.username} on the host too.`)
} else if (mode === 'delete') {
  await api('deleteWebhook', { drop_pending_updates: true })
  console.log('Webhook removed. The bot will not receive commands until `set` is run again.')
} else if (mode !== 'info') {
  console.error(`Unknown mode "${mode}". Use set, info or delete.`)
  process.exit(1)
}

const info = await api('getWebhookInfo')
console.log(JSON.stringify({
  url: info.url || '(none)',
  pending_updates: info.pending_update_count,
  last_error: info.last_error_message
    ? `${info.last_error_message} at ${new Date(info.last_error_date * 1000).toISOString()}`
    : null,
}, null, 2))
