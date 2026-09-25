// Types and constants for the bank-transfer donation flow.
//
// Deliberately free of any database or server-only import: the admin editor is
// a client component, so anything it needs has to be safe to ship to the
// browser. Server-side helpers (queries, pledge updates) live in
// lib/bank-transfer.ts, which re-exports everything here.

export type BankCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR'

// An offshore gift into a Nigerian domiciliary account travels in two hops: the
// donor's bank pays UBA's own account at a correspondent bank abroad, and UBA
// then credits the foundation. The numbers below belong to UBA, NOT to the
// foundation — they are the intermediary leg. Keeping them in their own shape
// is the whole point: dropped into BankAccount.iban they would read as the
// beneficiary IBAN, and a donor quoting them alone sends money that stops at
// Citibank with nothing to say who it is for.
export interface CorrespondentBank {
  bank_name: string
  swift: string
  routing_number?: string // ABA — US wires only
  sort_code?: string
  account_number: string // UBA's account with the correspondent
  iban?: string // UBA's IBAN with the correspondent
}

export interface BankAccount {
  currency: BankCurrency
  account_number: string
  // Optional international routing fields — blank until the foundation has them.
  sort_code?: string
  iban?: string
  swift?: string
  note?: string
  // Present only for currencies that arrive from offshore.
  correspondent?: CorrespondentBank
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
    // Domestic — paid directly, no intermediary.
    { currency: 'NGN', account_number: '1029685261' },

    // Foreign currency arrives via UBA's correspondents (per UBA's published
    // remittance-inflow instructions). swift here is UBA's own BIC: it names
    // the bank that makes the FINAL credit to the foundation's account.
    {
      currency: 'USD',
      account_number: '3005036418',
      swift: 'UNAFNGLA',
      correspondent: {
        bank_name: 'Citibank New York',
        swift: 'CITIUS33',
        routing_number: '021000089',
        account_number: '36320321',
      },
    },
    {
      currency: 'GBP',
      account_number: '3005036913',
      swift: 'UNAFNGLA',
      correspondent: {
        bank_name: 'Citibank London',
        swift: 'CITIGB2L',
        sort_code: '18 50 08',
        account_number: '13664090',
        iban: 'GB07CITI18500813664090',
      },
    },
    {
      currency: 'EUR',
      account_number: '3005036597',
      swift: 'UNAFNGLA',
      correspondent: {
        bank_name: 'Citibank London',
        swift: 'CITIGB2L',
        sort_code: '18 50 08',
        account_number: '13664082',
        iban: 'GB29CITI18500813664082',
      },
    },
  ],
}

export const CURRENCY_SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: ' £', EUR: '€' }

export const BANK_CURRENCIES: BankCurrency[] = ['NGN', 'USD', 'GBP', 'EUR']

// site_content holds whatever was last written to it, so what comes back is an
// untrusted shape, not a BankDetails. Coerce every field to the type the donor
// pages and the instructions email expect, and drop accounts in unknown
// currencies, so a malformed write degrades to the defaults rather than
// rendering `undefined` or an object into payment instructions.
export function normalizeBankDetails(stored: unknown): BankDetails {
  const d = (stored && typeof stored === 'object' ? stored : {}) as Partial<BankDetails>
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback)

  // A correspondent is only meaningful if it can actually be addressed, so it
  // survives normalization only when it carries both a name and a SWIFT. A
  // half-filled one is dropped rather than shown: incomplete intermediary
  // instructions strand a wire more surely than none at all, because the donor
  // stops looking once they see the section.
  const correspondent = (raw: unknown): CorrespondentBank | undefined => {
    if (!raw || typeof raw !== 'object') return undefined
    const c = raw as Partial<CorrespondentBank>
    const bank_name = str(c.bank_name)
    const swift = str(c.swift)
    if (!bank_name || !swift) return undefined
    return {
      bank_name,
      swift,
      routing_number: str(c.routing_number),
      sort_code: str(c.sort_code),
      account_number: str(c.account_number),
      iban: str(c.iban),
    }
  }

  const accounts = Array.isArray(d.accounts)
    ? d.accounts
        .filter(a => a && typeof a === 'object' && BANK_CURRENCIES.includes(a.currency))
        .map(a => ({
          currency: a.currency,
          account_number: str(a.account_number),
          sort_code: str(a.sort_code),
          iban: str(a.iban),
          swift: str(a.swift),
          note: str(a.note),
          correspondent: correspondent(a.correspondent),
        }))
    : DEFAULT_BANK_DETAILS.accounts

  return {
    enabled: typeof d.enabled === 'boolean' ? d.enabled : DEFAULT_BANK_DETAILS.enabled,
    account_name: str(d.account_name) || DEFAULT_BANK_DETAILS.account_name,
    bank_name: str(d.bank_name) || DEFAULT_BANK_DETAILS.bank_name,
    bank_address: str(d.bank_address),
    instructions: str(d.instructions),
    accounts,
  }
}

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
