import sql from '@/lib/db'
import {
  DEFAULT_BANK_DETAILS,
  type BankDetails, type BankPledge, type PledgeStatus,
} from '@/lib/bank-transfer-shared'

// Server-side helpers for the bank-transfer flow. Types and constants live in
// bank-transfer-shared so the admin editor (a client component) can import them
// without pulling the database client into the browser bundle.
export * from '@/lib/bank-transfer-shared'

// RFC 4648 base32, minus padding. Uppercase and digit-safe, so it survives
// certIdForReference()'s strip-and-uppercase without losing characters.
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

// The reference is an unauthenticated capability: anyone holding one can load
// /donate/bank-transfer/<ref> and read the donor's email and gift amount, and
// certIdForReference() derives the public receipt URL from it. So it has to be
// unguessable, not merely unique.
//
// 16 bytes (128 bits) rather than the 4 (32 bits) this started with. Base32
// rather than hex specifically because certIdForReference() keeps only the last
// 10 characters: a 32-symbol alphabet puts 50 bits in that window, where hex
// would leave 40.
//
// The trailing 3 bits of the 128 are dropped rather than emitted as a 26th
// character. A partial character encodes only 3 bits but occupies a full
// position, so it can land on just 8 of the 32 symbols — a visible bias in the
// last position, which is inside the certificate window. 25 whole characters of
// 5 uniform bits each (125 bits) is both simpler and better distributed.
export function generateReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let value = 0
  let bits = 0
  let out = ''

  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  return `WH-BT-${out}`
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
