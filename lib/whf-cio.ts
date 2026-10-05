import sql from './db'
import { BILLING_CYCLES, COST_CATEGORIES, CURRENCIES } from './ledger-shared'

// @neondatabase/serverless 0.10 accepts (text, params) on the query function but only
// types the tagged-template form.
type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const run = sql as unknown as (text: string, params?: unknown[]) => Promise<Row[]>

export type ColType = 'text' | 'date' | 'int' | 'bool' | 'money'

export interface Col {
  name: string
  type: ColType
  required?: boolean
  options?: readonly string[]
}

export interface Resource {
  table: string
  cols: readonly Col[]
  orderBy: string
  listQuery?: string
}

const TYPES_AUTHORITY = ['charity_commission', 'companies_house', 'cac', 'tin', 'other'] as const

// Column names here are interpolated into SQL, so this list is the whitelist:
// request bodies are only ever read through it, never used to name a column.
export const RESOURCES = {
  registrations: {
    table: 'cio_registrations',
    orderBy: 'authority, created_at',
    cols: [
      { name: 'authority', type: 'text', required: true, options: TYPES_AUTHORITY },
      { name: 'entity_name', type: 'text', required: true },
      { name: 'reg_number', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'registered_date', type: 'date' },
      { name: 'registered_address', type: 'text' },
      { name: 'notes', type: 'text' },
    ],
  },
  meetings: {
    table: 'cio_meetings',
    orderBy: 'meeting_date DESC',
    cols: [
      { name: 'meeting_date', type: 'date', required: true },
      { name: 'meeting_type', type: 'text', required: true, options: ['trustee', 'general', 'written_resolution'] },
      { name: 'title', type: 'text', required: true },
      { name: 'location', type: 'text' },
      { name: 'status', type: 'text', options: ['scheduled', 'held', 'cancelled'] },
      { name: 'attendees', type: 'text' },
      { name: 'minutes', type: 'text' },
    ],
  },
  declarations: {
    table: 'cio_declarations',
    orderBy: 'declaration_year DESC, declared_on DESC',
    listQuery:
      'SELECT d.*, t.full_name FROM cio_declarations d JOIN trustee_register t ON t.id = d.trustee_id ORDER BY d.declaration_year DESC, d.declared_on DESC',
    cols: [
      { name: 'trustee_id', type: 'text', required: true },
      { name: 'declaration_year', type: 'int', required: true },
      { name: 'declared_on', type: 'date', required: true },
      { name: 'has_conflicts', type: 'bool' },
      { name: 'details', type: 'text' },
    ],
  },
  policies: {
    table: 'cio_policies',
    orderBy: 'title',
    cols: [
      { name: 'title', type: 'text', required: true },
      { name: 'category', type: 'text' },
      { name: 'owner', type: 'text' },
      { name: 'status', type: 'text', options: ['draft', 'adopted', 'under_review', 'retired'] },
      { name: 'adopted_date', type: 'date' },
      { name: 'review_date', type: 'date' },
      { name: 'notes', type: 'text' },
    ],
  },
  // Operational Fixed Costs tab (components/admin/cio/FixedCostsTab.tsx).
  fixed_costs: {
    table: 'cio_fixed_costs',
    orderBy: 'is_active DESC, category, name',
    cols: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'text', required: true, options: COST_CATEGORIES },
      { name: 'supplier', type: 'text' },
      { name: 'amount', type: 'money', required: true },
      { name: 'currency', type: 'text', required: true, options: CURRENCIES },
      { name: 'billing_cycle', type: 'text', required: true, options: BILLING_CYCLES },
      { name: 'is_active', type: 'bool' },
      { name: 'is_public', type: 'bool' },
      { name: 'notes', type: 'text' },
    ],
  },
  filings: {
    table: 'cio_filings',
    orderBy: 'due_date',
    cols: [
      { name: 'title', type: 'text', required: true },
      { name: 'authority', type: 'text' },
      { name: 'due_date', type: 'date', required: true },
      { name: 'status', type: 'text', options: ['upcoming', 'submitted', 'not_required'] },
      { name: 'submitted_date', type: 'date' },
      { name: 'reference', type: 'text' },
      { name: 'notes', type: 'text' },
    ],
  },
} as const satisfies Record<string, Resource>

export type ResourceKey = keyof typeof RESOURCES

export function getResource(key: string): Resource | null {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key as ResourceKey] : null
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalise(col: Col, raw: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return col.required ? { ok: false, error: `${col.name} is required` } : { ok: true, value: col.type === 'bool' ? false : null }
  }
  switch (col.type) {
    case 'text': {
      const v = String(raw).trim()
      if (col.options && !col.options.includes(v)) return { ok: false, error: `${col.name} must be one of: ${col.options.join(', ')}` }
      return { ok: true, value: v }
    }
    case 'date': {
      const v = String(raw).slice(0, 10)
      const d = new Date(`${v}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
        return { ok: false, error: `${col.name} must be a valid date (YYYY-MM-DD)` }
      }
      return { ok: true, value: v }
    }
    case 'int': {
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isInteger(n) ? { ok: true, value: n } : { ok: false, error: `${col.name} must be a whole number` }
    }
    case 'bool':
      return { ok: true, value: raw === true || raw === 'true' }
    case 'money': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
      return Number.isFinite(n) && n >= 0
        ? { ok: true, value: Math.round(n * 100) / 100 }
        : { ok: false, error: `${col.name} must be an amount of zero or more` }
    }
  }
}

/**
 * Reads a request body through the resource's column whitelist. On create
 * (partial=false) every column is considered and required ones must be present.
 * On update (partial=true) only keys the caller sent are touched, so a field
 * can be cleared by sending an empty string -- COALESCE-style updates cannot.
 */
export function parseBody(
  res: Resource,
  body: unknown,
  partial: boolean
): { ok: true; values: Record<string, unknown> } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Invalid request body' }
  const input = body as Record<string, unknown>
  const values: Record<string, unknown> = {}
  for (const col of res.cols) {
    if (partial && !(col.name in input)) continue
    if (!partial && !(col.name in input) && !col.required) {
      // Omitted optional columns on create fall through to the column DEFAULT.
      continue
    }
    const r = normalise(col, input[col.name])
    if (!r.ok) return r
    values[col.name] = r.value
  }
  if (partial && Object.keys(values).length === 0) return { ok: false, error: 'Nothing to update' }
  return { ok: true, values }
}

export function buildInsert(res: Resource, values: Record<string, unknown>) {
  const names = Object.keys(values)
  const text = `INSERT INTO ${res.table} (${names.join(', ')}) VALUES (${names.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`
  return { text, params: names.map(n => values[n]) }
}

export function buildUpdate(res: Resource, id: string, values: Record<string, unknown>) {
  const names = Object.keys(values)
  const text = `UPDATE ${res.table} SET ${names.map((n, i) => `${n} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${names.length + 1} RETURNING *`
  return { text, params: [...names.map(n => values[n]), id] }
}

export async function listRows(res: Resource) {
  return run(res.listQuery ?? `SELECT * FROM ${res.table} ORDER BY ${res.orderBy}`)
}

export async function insertRow(res: Resource, values: Record<string, unknown>) {
  const q = buildInsert(res, values)
  const rows = await run(q.text, q.params)
  return rows[0]
}

export async function updateRow(res: Resource, id: string, values: Record<string, unknown>) {
  const q = buildUpdate(res, id, values)
  const rows = await run(q.text, q.params)
  return rows[0] ?? null
}

export async function deleteRow(res: Resource, id: string) {
  const rows = await run(`DELETE FROM ${res.table} WHERE id = $1 RETURNING id`, [id])
  return rows.length > 0
}

/** Maps Postgres constraint errors to a status and message the UI can show. */
export function dbErrorResponse(err: unknown): { status: number; error: string } {
  const code = (err as { code?: string } | null)?.code
  if (code === '23505') return { status: 409, error: 'A record with those details already exists' }
  if (code === '23503') return { status: 400, error: 'Referenced record does not exist' }
  if (code === '22P02' || code === '22007' || code === '22008') return { status: 400, error: 'Invalid value' }
  if (code === '42P01') return { status: 503, error: 'WHF-CIO tables are missing — run scripts/whf-cio-migration.sql in the Neon SQL editor' }
  return { status: 500, error: 'Database error' }
}
