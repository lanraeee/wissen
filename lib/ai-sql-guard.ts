// The safety layer between a language model and the database.
//
// The agent can read every table, so this file is the thing standing between
// "useful analyst" and "data breach". It assumes the model is adversarial --
// not because the model is malicious, but because a large amount of the text
// it reads was written by strangers on the internet (chat messages,
// scholarship essays, forum posts) and any of it may contain instructions
// aimed at the model. Treat every SQL string arriving here as if a visitor
// wrote it, because in the worst case one did.
//
// Defence is layered on purpose. Any single check here could have a hole;
// they are meant to fail independently.

export type SqlCheck =
  | { ok: true; sql: string }
  | { ok: false; reason: string }

// Hard row ceiling regardless of what the query asks for. Also bounds how
// much personal data a single answer can concentrate in one place.
export const MAX_ROWS = 200
// Per-cell truncation. site_content holds values over 400 KB (founder_bio is
// mostly base64 image data); one of those would eat the context window and
// push the real answer out of it.
export const MAX_CELL_CHARS = 2_000
export const STATEMENT_TIMEOUT_MS = 8_000

// Columns that must never leave the database, matched on name anywhere in the
// result set. Redaction happens on the returned rows rather than by trying to
// forbid them in the query, because a column can be reached through `SELECT *`,
// a join, an alias or a CTE, and blocking every spelling is a losing game --
// filtering the output is the one place all of those converge.
const REDACTED_COLUMNS = [
  'password_hash', 'password', 'token', 'secret', 'api_key', 'apikey',
  'reset_token', 'session_id', 'cookie', 'authorization',
  // Any binary column: enormous, and of no analytical value as text.
  'bytes',
]

// site_content rows whose value must never be read, whatever the query.
// bank_transfer_details decides which account donors are told to pay into;
// it is director-only in the admin for the same reason.
const REDACTED_CONTENT_KEYS = ['bank_transfer_details']

// Anything that writes, changes structure, escalates, reaches the filesystem,
// or reaches the network. A read-only transaction already refuses most of
// these; this exists so a refusal happens before the database is touched at
// all, and so the rejection can say what was wrong.
const FORBIDDEN = [
  'insert', 'update', 'delete', 'truncate', 'drop', 'alter', 'create',
  'grant', 'revoke', 'commit', 'rollback', 'savepoint', 'vacuum', 'analyze',
  'reindex', 'cluster', 'refresh', 'call', 'do', 'execute', 'prepare',
  'listen', 'notify', 'lock', 'set', 'reset', 'discard', 'copy',
  'pg_read_file', 'pg_read_binary_file', 'pg_ls_dir', 'pg_stat_file',
  'lo_import', 'lo_export', 'dblink', 'pg_sleep', 'pg_terminate_backend',
  'pg_cancel_backend', 'current_setting', 'set_config', 'pg_authid',
  'pg_shadow', 'pg_user_mapping',
]

// Strips comments and string literals before keyword scanning, so
// `WHERE body = 'please delete everything'` is not mistaken for a DELETE and
// `-- drop table` cannot smuggle one past the scan either.
function scannable(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, " '' ")
    .replace(/"(?:[^"]|"")*"/g, ' "" ')
    .toLowerCase()
}

export function checkReadOnlySql(raw: string): SqlCheck {
  const sql = raw.trim().replace(/;\s*$/, '')
  if (!sql) return { ok: false, reason: 'Empty query.' }
  if (sql.length > 4_000) return { ok: false, reason: 'Query too long.' }

  const scan = scannable(sql)

  // One statement only. Stripping strings and comments first means a
  // semicolon surviving here is a real statement separator, not one inside a
  // literal -- so `SELECT 1; DROP TABLE users` cannot ride along behind a
  // legitimate query.
  if (scan.includes(';')) {
    return { ok: false, reason: 'Only a single statement is allowed.' }
  }

  if (!/^\s*(select|with)\b/.test(scan)) {
    return { ok: false, reason: 'Only SELECT queries are allowed.' }
  }

  for (const word of FORBIDDEN) {
    // Word-boundary matched so `selected_at` does not trip on `select`, and
    // `updated_at` does not trip on `update`.
    if (new RegExp(`\\b${word}\\b`).test(scan)) {
      return { ok: false, reason: `\`${word}\` is not allowed in a read-only query.` }
    }
  }

  // `INTO` would write a table out of a SELECT.
  if (/\binto\b/.test(scan)) {
    return { ok: false, reason: 'SELECT ... INTO is not allowed.' }
  }

  // Never let a query read the catalog's credential tables or reach back out
  // through a foreign-data wrapper.
  if (/\bpg_catalog\b|\bpg_authid\b|\binformation_schema\.user/.test(scan)) {
    return { ok: false, reason: 'System catalog access is not allowed.' }
  }

  // A missing LIMIT on page_views or opportunities would return the table.
  // Appending one is friendlier than refusing, and MAX_ROWS is enforced again
  // on the result set regardless of what the query claims.
  const limited = /\blimit\s+\d+/.test(scan) ? sql : `${sql} LIMIT ${MAX_ROWS}`

  return { ok: true, sql: limited }
}

// Applied to every row that comes back, before anything reaches the model.
export function redactRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.slice(0, MAX_ROWS).map(row => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      const lower = key.toLowerCase()

      if (REDACTED_COLUMNS.some(c => lower.includes(c))) {
        out[key] = '[redacted]'
        continue
      }
      // site_content is key/value, so the sensitive part is identified by a
      // sibling column rather than by this column's own name.
      if (lower === 'value' && typeof row.key === 'string'
          && REDACTED_CONTENT_KEYS.includes(row.key)) {
        out[key] = '[redacted]'
        continue
      }

      if (value === null || value === undefined) { out[key] = value; continue }

      if (typeof value === 'object') {
        const text = JSON.stringify(value) ?? ''
        out[key] = text.length > MAX_CELL_CHARS ? text.slice(0, MAX_CELL_CHARS) + '…[truncated]' : text
        continue
      }

      const text = String(value)
      out[key] = text.length > MAX_CELL_CHARS ? text.slice(0, MAX_CELL_CHARS) + '…[truncated]' : value
    }
    return out
  })
}
