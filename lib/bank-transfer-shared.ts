// Types and constants for the bank-transfer donation flow.
//
// Deliberately free of any database or server-only import: the admin editor is
// a client component, so anything it needs has to be safe to ship to the
// browser. Server-side helpers (queries, pledge updates) live in
// lib/bank-transfer.ts, which re-exports everything here.

export type BankCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR'

export interface BankAccount {
  currency: BankCurrency
  account_number: string
  // Optional international routing fields — blank until the foundation has them.
  sort_code?: string
  iban?: string
  swift?: string
  note?: string
}

export interface BankDetails {
  enabled: boolean
  account_name: string
  bank_name: string
  bank_address?: string
  instructions?: string
  accounts: BankAccount[]
}

// Seeded with the foundation's live UBA accounts so the flow works before an
// admin ever opens the editor. Everything here is overridable from
// /admin/content?tab=bank-details (site_content key 'bank_transfer_details').
export const DEFAULT_BANK_DETAILS: BankDetails = {
  enabled: true,
  account_name: 'Wissen Haus Empowerment Foundation',
  bank_name: 'UBA',
  bank_address: '',
  instructions: 'Please quote your donation reference in the transfer narration so we can match your gift to your receipt.',
  accounts: [
    { currency: 'NGN', account_number: '1029685261' },
    { currency: 'USD', account_number: '3005036418' },
    { currency: 'GBP', account_number: '3005036913' },
    { currency: 'EUR', account_number: '3005036597' },
  ],
}

export const CURRENCY_SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

// A bank-transfer pledge: the donor has filled in the donation form and been
// shown the account details, but no money has been verified yet. It becomes a
// real donation (receipt + certificate) only when an admin confirms it landed.
export type PledgeStatus = 'awaiting_transfer' | 'declared_sent' | 'confirmed' | 'cancelled'

export interface BankPledge {
  reference: string
  name: string
  email: string
  amount: number
  currency: BankCurrency
  message?: string
  status: PledgeStatus
  created_at: string
  declared_at?: string
  confirmed_at?: string
  cert_id?: string
}

export function accountFor(details: BankDetails, currency: string): BankAccount | null {
  return details.accounts.find(a => a.currency === currency) ?? null
}
