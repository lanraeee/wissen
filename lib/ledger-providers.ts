import crypto from 'crypto'
import { getStripe } from '@/lib/stripe'
import { getSiteContent } from '@/lib/site-content'
import { writeContent } from '@/lib/content-approvals'
import type { LedgerSource } from '@/lib/ledger-shared'

// Bank-feed connectors for the WHF-CIO Financial Ledger. Each one turns a
// provider's recent transactions into ProviderTxn rows; lib/ledger.ts upserts
// them. A connector that has no credentials reports configured() === false
// and is skipped, so adding a bank later is an env-var change, not a deploy.
//
// Public-safety rule for every connector: `description` is what the public
// ledger shows, so it is built from the transaction TYPE only ("Bank
// receipt", "Card donation via Stripe"). The provider's free text -- a bank
// reference or a Stripe description, which often carries a donor's name --
// goes in `counterparty`, which only directors see. A director can then write
// a better public description through an override.

export interface ProviderTxn {
  source: LedgerSource
  accountLabel: string
  externalId: string
  occurredOn: string // YYYY-MM-DD
  direction: 'in' | 'out'
  amount: number // always >= 0, major units
  fee: number | null
  currency: string
  description: string
  category: string | null
  counterparty: string | null
  isTransfer: boolean
}

export interface LedgerProvider {
  /** Key for cio_ledger_sync. */
  key: string
  label: string
  configured(): boolean | Promise<boolean>
  fetchRecent(limit: number): Promise<ProviderTxn[]>
}

const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function present(v: string | undefined): v is string {
  return !!v && v.trim() !== '' && v !== 'placeholder'
}

// ─── Stripe ─────────────────────────────────────────────────────────────────
// Balance transactions rather than charges: they are what actually moved
// through the Stripe balance, and they carry the fee and the payouts.

const STRIPE_TYPES: Record<string, { description: string; category: string; transfer?: boolean }> = {
  charge: { description: 'Card donation via Stripe', category: 'donation' },
  payment: { description: 'Donation via Stripe', category: 'donation' },
  refund: { description: 'Refund issued via Stripe', category: 'refund' },
  payment_refund: { description: 'Refund issued via Stripe', category: 'refund' },
  payout: { description: 'Stripe payout to bank account', category: 'transfer', transfer: true },
  payout_cancel: { description: 'Stripe payout reversed', category: 'transfer', transfer: true },
  payout_failure: { description: 'Stripe payout returned', category: 'transfer', transfer: true },
  stripe_fee: { description: 'Stripe account fees', category: 'fees' },
  adjustment: { description: 'Stripe balance adjustment', category: 'other' },
}

export interface StripeBalanceTxn {
  id: string
  amount: number
  fee: number
  currency: string
  created: number
  type: string
  description: string | null
}

export function mapStripeTxn(t: StripeBalanceTxn): ProviderTxn {
  const divisor = ZERO_DECIMAL.has(t.currency.toLowerCase()) ? 1 : 100
  const known = STRIPE_TYPES[t.type]
  return {
    source: 'stripe',
    accountLabel: 'Stripe',
    externalId: t.id,
    occurredOn: isoDate(new Date(t.created * 1000)),
    direction: t.amount >= 0 ? 'in' : 'out',
    amount: Math.abs(t.amount) / divisor,
    fee: t.fee ? t.fee / divisor : null,
    currency: t.currency.toUpperCase(),
    description: known?.description ?? `Stripe ${t.type.replace(/_/g, ' ')}`,
    category: known?.category ?? 'other',
    counterparty: t.description,
    isTransfer: !!known?.transfer,
  }
}

export const stripeProvider: LedgerProvider = {
  key: 'stripe',
  label: 'Stripe',
  configured: () => present(process.env.STRIPE_SECRET_KEY),
  async fetchRecent(limit) {
    const page = await getStripe().balanceTransactions.list({ limit: Math.min(limit, 100) })
    return page.data.map(t => mapStripeTxn(t as unknown as StripeBalanceTxn))
  },
}

// ─── UK banks, including Tide: GoCardless Bank Account Data ────────────────
// Tide has no public API of its own for this; it is reached through an Open
// Banking aggregator. GoCardless Bank Account Data (formerly Nordigen) covers
// Tide and the other UK high-street banks. A director links each account once
// in the GoCardless portal (an end-user agreement and requisition), which
// yields an account id; that id goes in LEDGER_GOCARDLESS_ACCOUNTS.

export interface BankAccountConfig {
  source: LedgerSource
  label: string
  accountId: string
}

/**
 * Parses `source:label:accountId;source:label:accountId`. Entries with an
 * unknown source or a missing part are dropped rather than failing the whole
 * list, so one typo does not switch off every other bank.
 */
export function parseAccountList(raw: string | undefined, allowed: LedgerSource[], fallbackSource?: LedgerSource): BankAccountConfig[] {
  if (!raw) return []
  const out: BankAccountConfig[] = []
  for (const part of raw.split(';')) {
    const bits = part.split(':').map(s => s.trim())
    let source: string, label: string, accountId: string
    if (bits.length === 3) [source, label, accountId] = bits
    else if (bits.length === 2 && fallbackSource) [source, label, accountId] = [fallbackSource, bits[0], bits[1]]
    else continue
    if (!label || !accountId || !allowed.includes(source as LedgerSource)) continue
    out.push({ source: source as LedgerSource, label, accountId })
  }
  return out
}

function stableId(prefix: string, ...parts: unknown[]) {
  return `${prefix}:${crypto.createHash('sha256').update(parts.map(p => String(p ?? '')).join('|')).digest('hex').slice(0, 24)}`
}

export interface GoCardlessTxn {
  transactionId?: string
  internalTransactionId?: string
  bookingDate?: string
  valueDate?: string
  transactionAmount: { amount: string; currency: string }
  remittanceInformationUnstructured?: string
  remittanceInformationUnstructuredArray?: string[]
  creditorName?: string
  debtorName?: string
}

export function mapGoCardlessTxn(acct: BankAccountConfig, t: GoCardlessTxn): ProviderTxn | null {
  const amount = Number(t.transactionAmount?.amount)
  const date = (t.bookingDate ?? t.valueDate ?? '').slice(0, 10)
  if (!Number.isFinite(amount) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const direction = amount >= 0 ? 'in' : 'out'
  const reference = t.remittanceInformationUnstructured ?? t.remittanceInformationUnstructuredArray?.join(' ') ?? ''
  const party = direction === 'in' ? t.debtorName : t.creditorName
  const id = t.transactionId ?? t.internalTransactionId
  return {
    source: acct.source,
    accountLabel: acct.label,
    externalId: id ? `${acct.accountId}:${id}` : stableId(acct.accountId, date, t.transactionAmount.amount, reference, party),
    occurredOn: date,
    direction,
    amount: Math.abs(amount),
    fee: null,
    currency: (t.transactionAmount.currency || 'GBP').toUpperCase(),
    description: direction === 'in' ? 'Bank receipt' : 'Bank payment',
    category: null,
    counterparty: [party, reference].filter(Boolean).join(' · ') || null,
    isTransfer: false,
  }
}

const GOCARDLESS_BASE = 'https://bankaccountdata.gocardless.com/api/v2'

export async function gocardlessToken(): Promise<string> {
  const res = await fetch(`${GOCARDLESS_BASE}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ secret_id: process.env.GOCARDLESS_SECRET_ID, secret_key: process.env.GOCARDLESS_SECRET_KEY }),
  })
  if (!res.ok) throw new Error(`GoCardless token request failed (${res.status})`)
  const data = await res.json() as { access?: string }
  if (!data.access) throw new Error('GoCardless token response had no access token')
  return data.access
}

const UK_SOURCES: LedgerSource[] = ['tide', 'uk_bank']

// Accounts linked through the in-admin "Connect" flow (see the gocardless/
// connect + callback routes) are stored here rather than requiring an env
// var + redeploy -- LEDGER_GOCARDLESS_ACCOUNTS still works too, and both are
// merged, so an account set either way is picked up.
const STORED_ACCOUNTS_KEY = 'ledger_bank_accounts'

export async function getStoredAccounts(): Promise<BankAccountConfig[]> {
  const stored = await getSiteContent<BankAccountConfig[]>(STORED_ACCOUNTS_KEY)
  return Array.isArray(stored) ? stored : []
}

/** Merges by accountId -- a newly linked account replaces a same-id entry rather than duplicating it. */
export async function addStoredAccounts(newAccounts: BankAccountConfig[]): Promise<BankAccountConfig[]> {
  const existing = await getStoredAccounts()
  const byId = new Map(existing.map(a => [a.accountId, a]))
  for (const a of newAccounts) byId.set(a.accountId, a)
  const merged = Array.from(byId.values())
  await writeContent(STORED_ACCOUNTS_KEY, merged)
  return merged
}

async function allGocardlessAccounts(): Promise<BankAccountConfig[]> {
  const envAccounts = parseAccountList(process.env.LEDGER_GOCARDLESS_ACCOUNTS, UK_SOURCES)
  const byId = new Map(envAccounts.map(a => [a.accountId, a]))
  for (const a of await getStoredAccounts()) if (!byId.has(a.accountId)) byId.set(a.accountId, a)
  return Array.from(byId.values())
}

export const gocardlessProvider: LedgerProvider = {
  key: 'gocardless',
  label: 'Tide & UK banks (GoCardless)',
  async configured() {
    if (!present(process.env.GOCARDLESS_SECRET_ID) || !present(process.env.GOCARDLESS_SECRET_KEY)) return false
    return (await allGocardlessAccounts()).length > 0
  },
  async fetchRecent(limit) {
    const token = await gocardlessToken()
    const out: ProviderTxn[] = []
    for (const acct of await allGocardlessAccounts()) {
      const res = await fetch(`${GOCARDLESS_BASE}/accounts/${encodeURIComponent(acct.accountId)}/transactions/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`GoCardless transactions for "${acct.label}" failed (${res.status})`)
      const data = await res.json() as { transactions?: { booked?: GoCardlessTxn[] } }
      const booked = data.transactions?.booked ?? []
      for (const t of booked.slice(0, limit)) {
        const m = mapGoCardlessTxn(acct, t)
        if (m) out.push(m)
      }
    }
    return out
  },
}

// ─── GoCardless requisition flow (the in-admin "Connect Tide" button) ─────
// A requisition is GoCardless's term for one bank-consent session: create
// it, send the director to `link` to log into Tide and authorise read
// access, then once they're back, the requisition's `accounts` array has
// the account id(s) to start pulling transactions from. None of this is a
// webhook -- Bank Account Data has no webhook feature at all, this is a
// create-then-redirect-then-poll-once flow, same pull model as fetchRecent.

export interface GCInstitution { id: string; name: string }

export async function gocardlessFindInstitution(token: string, nameQuery: string, country = 'GB'): Promise<GCInstitution | null> {
  const res = await fetch(`${GOCARDLESS_BASE}/institutions/?country=${encodeURIComponent(country)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`GoCardless institutions lookup failed (${res.status})`)
  const list = await res.json() as GCInstitution[]
  const needle = nameQuery.trim().toLowerCase()
  return list.find(i => i.name.toLowerCase().includes(needle)) ?? null
}

export interface GCRequisition { id: string; link: string; status?: string; accounts?: string[]; reference?: string }

export async function gocardlessCreateRequisition(token: string, opts: { institutionId: string; redirectUrl: string; reference: string }): Promise<GCRequisition> {
  const res = await fetch(`${GOCARDLESS_BASE}/requisitions/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ redirect: opts.redirectUrl, institution_id: opts.institutionId, reference: opts.reference }),
  })
  if (!res.ok) throw new Error(`GoCardless requisition create failed (${res.status})`)
  return res.json() as Promise<GCRequisition>
}

export async function gocardlessGetRequisition(token: string, requisitionId: string): Promise<GCRequisition> {
  const res = await fetch(`${GOCARDLESS_BASE}/requisitions/${encodeURIComponent(requisitionId)}/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`GoCardless requisition lookup failed (${res.status})`)
  return res.json() as Promise<GCRequisition>
}

/** Best-effort only -- a label worth showing, never worth failing the connect flow over. */
export async function gocardlessAccountDisplayName(token: string, accountId: string): Promise<string | null> {
  try {
    const res = await fetch(`${GOCARDLESS_BASE}/accounts/${encodeURIComponent(accountId)}/details/`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json() as { account?: { ownerName?: string; name?: string; iban?: string; product?: string } }
    const a = data.account
    return a?.name || a?.ownerName || a?.product || (a?.iban ? `IBAN …${a.iban.slice(-4)}` : null)
  } catch {
    return null
  }
}

// Pending requisitions, keyed by the `reference` we hand GoCardless at
// creation time -- its redirect back to us only carries that reference, so
// the callback route looks the requisition id up by it. Short-lived by
// nature (a director either completes the bank login within minutes or
// abandons it), so no cleanup job: a stale entry is simply never matched
// again and is harmless left behind.
const PENDING_KEY = 'ledger_gocardless_pending'

interface PendingRequisition { requisitionId: string; institutionName: string; createdAt: string }

export async function savePendingRequisition(reference: string, requisitionId: string, institutionName: string): Promise<void> {
  const all = (await getSiteContent<Record<string, PendingRequisition>>(PENDING_KEY)) ?? {}
  all[reference] = { requisitionId, institutionName, createdAt: new Date().toISOString() }
  await writeContent(PENDING_KEY, all)
}

export async function takePendingRequisition(reference: string): Promise<PendingRequisition | null> {
  const all = (await getSiteContent<Record<string, PendingRequisition>>(PENDING_KEY)) ?? {}
  const found = all[reference] ?? null
  if (found) {
    delete all[reference]
    await writeContent(PENDING_KEY, all)
  }
  return found
}

// ─── Nigerian banks: Mono ───────────────────────────────────────────────────
// Mono (withmono.com) is the Open Banking aggregator covering the Nigerian
// banks. As with GoCardless, each account is linked once through Mono
// Connect, which yields the account id for LEDGER_MONO_ACCOUNTS.

export interface MonoTxn {
  id?: string
  _id?: string
  narration?: string
  amount: number // kobo
  type: string // 'credit' | 'debit'
  date: string
  currency?: string
}

export function mapMonoTxn(acct: BankAccountConfig, t: MonoTxn): ProviderTxn | null {
  const date = String(t.date ?? '').slice(0, 10)
  const amount = Number(t.amount)
  if (!Number.isFinite(amount) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const direction = String(t.type).toLowerCase() === 'credit' ? 'in' : 'out'
  const id = t.id ?? t._id
  return {
    source: 'ng_bank',
    accountLabel: acct.label,
    externalId: id ? `${acct.accountId}:${id}` : stableId(acct.accountId, date, t.amount, t.narration, t.type),
    occurredOn: date,
    direction,
    amount: Math.abs(amount) / 100,
    fee: null,
    currency: (t.currency || 'NGN').toUpperCase(),
    description: direction === 'in' ? 'Bank receipt' : 'Bank payment',
    category: null,
    counterparty: t.narration || null,
    isTransfer: false,
  }
}

export const monoProvider: LedgerProvider = {
  key: 'mono',
  label: 'Nigerian banks (Mono)',
  configured: () => present(process.env.MONO_SECRET_KEY) && parseAccountList(process.env.LEDGER_MONO_ACCOUNTS, ['ng_bank'], 'ng_bank').length > 0,
  async fetchRecent(limit) {
    const out: ProviderTxn[] = []
    for (const acct of parseAccountList(process.env.LEDGER_MONO_ACCOUNTS, ['ng_bank'], 'ng_bank')) {
      const res = await fetch(`https://api.withmono.com/v2/accounts/${encodeURIComponent(acct.accountId)}/transactions?paginate=false`, {
        headers: { 'mono-sec-key': process.env.MONO_SECRET_KEY as string, Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`Mono transactions for "${acct.label}" failed (${res.status})`)
      const data = await res.json() as { data?: MonoTxn[] }
      for (const t of (data.data ?? []).slice(0, limit)) {
        const m = mapMonoTxn(acct, t)
        if (m) out.push(m)
      }
    }
    return out
  },
}

export const PROVIDERS: LedgerProvider[] = [stripeProvider, gocardlessProvider, monoProvider]
