import sql from './db'
import { log } from './logger'
import { PROVIDERS, type LedgerProvider, type ProviderTxn } from './ledger-providers'
import { LEDGER_LIMIT } from './ledger-shared'

// Server half of the Financial Ledger and Operational Fixed Costs tabs.
// lib/ledger-shared.ts has the client-safe half.

/** A provider is not re-polled more often than this unless a director forces it. */
export const SYNC_INTERVAL_MS = 15 * 60_000

/** Fields a director can change on any row. Financial ones need a reason on synced rows. */
export const OVERRIDABLE = [
  'occurred_on', 'direction', 'amount', 'currency', 'description', 'category',
  'counterparty', 'account_label', 'is_transfer', 'is_public', 'excluded',
] as const

export async function listLedger() {
  return sql`
    SELECT * FROM cio_ledger_entries
    ORDER BY occurred_on DESC, created_at DESC
    LIMIT ${LEDGER_LIMIT}
  `
}

/** What /transparency/ledger shows: never the counterparty, never excluded or private rows. */
export async function listPublicLedger() {
  return sql`
    SELECT id, occurred_on, source, direction, amount, currency, description, category, is_transfer
    FROM cio_ledger_entries
    WHERE is_public AND NOT excluded
    ORDER BY occurred_on DESC, created_at DESC
    LIMIT ${LEDGER_LIMIT}
  `
}

export async function listPublicFixedCosts() {
  return sql`
    SELECT id, name, category, supplier, amount, currency, billing_cycle, updated_at
    FROM cio_fixed_costs
    WHERE is_active AND is_public
    ORDER BY category, name
  `
}

export interface ProviderStatus {
  key: string
  label: string
  configured: boolean
  lastRunAt: string | null
  lastStatus: string | null
  lastError: string | null
  lastCount: number | null
}

export async function providerStatuses(): Promise<ProviderStatus[]> {
  let rows: Record<string, unknown>[] = []
  try {
    rows = await sql`SELECT * FROM cio_ledger_sync`
  } catch (err) {
    log.error('ledger', err, { stage: 'read sync status' })
  }
  return PROVIDERS.map(p => {
    const r = rows.find(x => x.provider === p.key)
    return {
      key: p.key,
      label: p.label,
      configured: p.configured(),
      lastRunAt: r?.last_run_at ? new Date(r.last_run_at as string).toISOString() : null,
      lastStatus: (r?.last_status as string) ?? null,
      lastError: (r?.last_error as string) ?? null,
      lastCount: r?.last_count == null ? null : Number(r.last_count),
    }
  })
}

/**
 * Inserts a synced transaction, or refreshes it if it is already there --
 * unless a director has overridden that row, in which case the director's
 * version stands and the sync leaves it alone.
 */
async function upsertTxn(t: ProviderTxn): Promise<boolean> {
  const rows = await sql`
    INSERT INTO cio_ledger_entries
      (source, account_label, external_id, occurred_on, direction, amount, fee, currency, description, category, counterparty, is_transfer, created_by)
    VALUES
      (${t.source}, ${t.accountLabel}, ${t.externalId}, ${t.occurredOn}, ${t.direction}, ${t.amount}, ${t.fee}, ${t.currency},
       ${t.description}, ${t.category}, ${t.counterparty}, ${t.isTransfer}, 'sync')
    ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL DO UPDATE SET
      account_label = EXCLUDED.account_label,
      occurred_on   = EXCLUDED.occurred_on,
      direction     = EXCLUDED.direction,
      amount        = EXCLUDED.amount,
      fee           = EXCLUDED.fee,
      currency      = EXCLUDED.currency,
      counterparty  = EXCLUDED.counterparty,
      is_transfer   = EXCLUDED.is_transfer,
      updated_at    = NOW()
    WHERE cio_ledger_entries.overridden = FALSE
    RETURNING id
  `
  return rows.length > 0
}

export interface SyncResult {
  key: string
  status: 'ok' | 'error' | 'skipped' | 'not_configured'
  count?: number
  error?: string
}

async function syncOne(p: LedgerProvider, force: boolean): Promise<SyncResult> {
  if (!p.configured()) return { key: p.key, status: 'not_configured' }

  if (!force) {
    const [row] = await sql`SELECT last_run_at FROM cio_ledger_sync WHERE provider = ${p.key}`
    if (row?.last_run_at && Date.now() - new Date(row.last_run_at as string).getTime() < SYNC_INTERVAL_MS) {
      return { key: p.key, status: 'skipped' }
    }
  }

  let result: SyncResult
  try {
    const txns = await p.fetchRecent(LEDGER_LIMIT)
    let count = 0
    for (const t of txns) if (await upsertTxn(t)) count++
    result = { key: p.key, status: 'ok', count }
  } catch (err) {
    log.error('ledger sync', err, { provider: p.key })
    // Only the message: a provider error body can echo request details back.
    result = { key: p.key, status: 'error', error: err instanceof Error ? err.message.slice(0, 300) : 'Sync failed' }
  }

  await sql`
    INSERT INTO cio_ledger_sync (provider, last_run_at, last_status, last_error, last_count)
    VALUES (${p.key}, NOW(), ${result.status}, ${result.error ?? null}, ${result.count ?? null})
    ON CONFLICT (provider) DO UPDATE SET
      last_run_at = NOW(), last_status = EXCLUDED.last_status,
      last_error = EXCLUDED.last_error, last_count = EXCLUDED.last_count
  `
  return result
}

/** Pulls recent transactions from every configured provider. Never throws per provider. */
export async function syncLedger({ force = false } = {}): Promise<SyncResult[]> {
  const out: SyncResult[] = []
  for (const p of PROVIDERS) {
    try {
      out.push(await syncOne(p, force))
    } catch (err) {
      // The sync table itself is missing or unreachable.
      log.error('ledger sync', err, { provider: p.key, stage: 'bookkeeping' })
      out.push({ key: p.key, status: 'error', error: 'Could not record sync status' })
    }
  }
  return out
}

type Row = Record<string, unknown>

/** The fields an override changed, as before/after pairs for the audit log. */
export function diffRow(before: Row, after: Row): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const k of OVERRIDABLE) {
    if (!(k in after)) continue
    const a = normaliseForCompare(k, before[k])
    const b = normaliseForCompare(k, after[k])
    if (a !== b) changes[k] = { from: before[k] ?? null, to: after[k] ?? null }
  }
  return changes
}

function normaliseForCompare(k: string, v: unknown) {
  if (v === null || v === undefined || v === '') return ''
  if (k === 'amount') return Number(v).toFixed(2)
  if (k === 'occurred_on') return String(v instanceof Date ? v.toISOString() : v).slice(0, 10)
  return String(v)
}
