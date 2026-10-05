import crypto from 'crypto'
import { getStripe } from '@/lib/stripe'
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
  configured(): boolean
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

async function gocardlessToken(): Promise<string> {
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

export const gocardlessProvider: LedgerProvider = {
  key: 'gocardless',
  label: 'Tide & UK banks (GoCardless)',
  configured: () =>
    present(process.env.GOCARDLESS_SECRET_ID) && present(process.env.GOCARDLESS_SECRET_KEY)
    && parseAccountList(process.env.LEDGER_GOCARDLESS_ACCOUNTS, UK_SOURCES).length > 0,
  async fetchRecent(limit) {
    const token = await gocardlessToken()
    const out: ProviderTxn[] = []
    for (const acct of parseAccountList(process.env.LEDGER_GOCARDLESS_ACCOUNTS, UK_SOURCES)) {
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
