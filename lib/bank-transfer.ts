import sql from '@/lib/db'
import {
  DEFAULT_BANK_DETAILS,
  type BankDetails, type BankPledge, type PledgeStatus,
} from '@/lib/bank-transfer-shared'

// Server-side helpers for the bank-transfer flow. Types and constants live in
// bank-transfer-shared so the admin editor (a client component) can import them
// without pulling the database client into the browser bundle.
export * from '@/lib/bank-transfer-shared'

export function generateReference(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  return `WH-BT-${hex}`
}

export async function getBankDetails(): Promise<BankDetails> {
  try {
    const [row] = await sql`SELECT value FROM site_content WHERE key = 'bank_transfer_details'`
    if (!row?.value) return DEFAULT_BANK_DETAILS
    const stored = row.value as Partial<BankDetails>
    return {
      ...DEFAULT_BANK_DETAILS,
      ...stored,
      // A missing key falls back to the seeded accounts; an admin who has
      // deliberately saved an empty list keeps their empty list.
      accounts: stored.accounts ?? DEFAULT_BANK_DETAILS.accounts,
    }
  } catch (err) {
    console.error('[bank details load]', err)
    return DEFAULT_BANK_DETAILS
  }
}

export async function getPledge(reference: string): Promise<BankPledge | null> {
  try {
    const [row] = await sql`
      SELECT data FROM submissions
      WHERE type = 'bank_transfer' AND data->>'reference' = ${reference}
      LIMIT 1
    `
    return (row?.data as BankPledge) ?? null
  } catch (err) {
    console.error('[bank pledge load]', err)
    return null
  }
}

// Mirrors the pledge's own lifecycle onto the submissions.status column the
// admin list filters and colour-codes on.
function rowStatusFor(status?: PledgeStatus): string {
  if (status === 'confirmed') return 'actioned'
  if (status === 'declared_sent') return 'reviewed'
  return 'pending'
}

// Merges fields into the stored pledge JSON. Returns the updated pledge, or
// null if no pledge with that reference exists.
export async function updatePledge(reference: string, patch: Partial<BankPledge>): Promise<BankPledge | null> {
  const [row] = await sql`
    UPDATE submissions
    SET data   = data || ${JSON.stringify(patch)}::jsonb,
        status = ${rowStatusFor(patch.status)}
    WHERE type = 'bank_transfer' AND data->>'reference' = ${reference}
    RETURNING data
  `
  return (row?.data as BankPledge) ?? null
}
