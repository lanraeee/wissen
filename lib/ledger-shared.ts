// Client-safe half of the Financial Ledger and Operational Fixed Costs tabs:
// labels, money formatting and the arithmetic both the admin tabs and the
// public /transparency pages show. No server imports, so client components can
// use it. lib/ledger.ts owns the database side.

export const LEDGER_SOURCES = ['stripe', 'tide', 'uk_bank', 'ng_bank', 'zeffy', 'manual'] as const
export type LedgerSource = (typeof LEDGER_SOURCES)[number]

export const SOURCE_LABELS: Record<LedgerSource, string> = {
  stripe: 'Stripe',
  tide: 'Tide',
  uk_bank: 'UK bank',
  ng_bank: 'Nigerian bank',
  zeffy: 'Zeffy',
  manual: 'Manual entry',
}

export const LEDGER_CATEGORIES = [
  'donation', 'grant', 'programme', 'operations', 'fees', 'refund', 'transfer', 'other',
] as const

export const CURRENCIES = ['GBP', 'NGN', 'USD', 'EUR'] as const

export const COST_CATEGORIES = ['tools', 'services', 'admin', 'other'] as const
export const BILLING_CYCLES = ['monthly', 'quarterly', 'annual'] as const
export type BillingCycle = (typeof BILLING_CYCLES)[number]

/** How many rows the ledger shows, in the admin tab and publicly. */
export const LEDGER_LIMIT = 100

export interface LedgerRow {
  id?: string
  occurred_on: string
  source: LedgerSource
  direction: 'in' | 'out'
  amount: number | string
  currency: string
  description: string
  category?: string | null
  is_transfer?: boolean
  excluded?: boolean
}

export function formatMoney(amount: number | string, currency: string) {
  const n = Number(amount)
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(n)
  } catch {
    // An unknown ISO code (a typo in a manual entry) must not take the page down.
    return `${currency} ${n.toFixed(2)}`
  }
}

export interface CurrencyTotals {
  currency: string
  moneyIn: number
  moneyOut: number
  net: number
}

/**
 * Money in and out per currency. Transfers between the foundation's own
 * accounts (a Stripe payout landing in Tide) are left out, or every payout
 * would be counted twice; excluded rows are left out because a director said
 * so. Currencies are never converted into one another.
 */
export function totalsByCurrency(rows: LedgerRow[]): CurrencyTotals[] {
  const map = new Map<string, CurrencyTotals>()
  for (const r of rows) {
    if (r.is_transfer || r.excluded) continue
    const t = map.get(r.currency) ?? { currency: r.currency, moneyIn: 0, moneyOut: 0, net: 0 }
    const amt = Number(r.amount) || 0
    if (r.direction === 'in') t.moneyIn += amt
    else t.moneyOut += amt
    t.net = round2(t.moneyIn - t.moneyOut)
    t.moneyIn = round2(t.moneyIn)
    t.moneyOut = round2(t.moneyOut)
    map.set(r.currency, t)
  }
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency))
}

export function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function monthlyEquivalent(amount: number | string, cycle: string) {
  const n = Number(amount) || 0
  if (cycle === 'annual') return round2(n / 12)
  if (cycle === 'quarterly') return round2(n / 3)
  return round2(n)
}

export interface CostRow {
  amount: number | string
  currency: string
  billing_cycle: string
  is_active?: boolean
}

/** Monthly running cost per currency, active lines only. */
export function monthlyTotals(rows: CostRow[]): { currency: string; monthly: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    if (r.is_active === false) continue
    map.set(r.currency, round2((map.get(r.currency) ?? 0) + monthlyEquivalent(r.amount, r.billing_cycle)))
  }
  return [...map.entries()].map(([currency, monthly]) => ({ currency, monthly })).sort((a, b) => a.currency.localeCompare(b.currency))
}
