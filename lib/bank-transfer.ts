import sql from '@/lib/db'
import {
  DEFAULT_BANK_DETAILS, normalizeBankDetails,
  type BankDetails, type BankPledge, type PledgeStatus, type BankCurrency,
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
    // A missing key falls back to the seeded accounts; a director who has
    // deliberately saved an empty list keeps their empty list.
    return normalizeBankDetails(row.value)
  } catch (err) {
    console.error('[bank details load]', err)
    return DEFAULT_BANK_DETAILS
  }
}

function mapRow(row: Record<string, unknown>): BankPledge {
  return {
    id: row.id as string,
    reference: row.reference as string,
    name: row.name as string,
    email: row.email as string,
    amount: Number(row.amount),
    currency: row.currency as BankCurrency,
    message: (row.message as string | null) ?? undefined,
    status: row.status as PledgeStatus,
    created_at: row.created_at as string,
    declared_at: (row.declared_at as string | null) ?? undefined,
    confirmed_at: (row.confirmed_at as string | null) ?? undefined,
    donation_id: (row.donation_id as string | null) ?? undefined,
    cert_id: (row.donation_cert_id as string | null) ?? undefined,
  }
}

// Records a new pledge (donor filled in the donation form, hasn't sent the
// money yet). Centralizes what app/api/payments/bank-transfer/route.ts used
// to insert directly, matching getPledge/updatePledge's centralization.
export async function createPledge(input: {
  reference: string; name: string; email: string; amount: number; currency: BankCurrency; message?: string
}): Promise<void> {
  await sql`
    INSERT INTO bank_transfers (reference, name, email, amount, currency, message)
    VALUES (${input.reference}, ${input.name}, ${input.email}, ${input.amount}, ${input.currency}, ${input.message ?? null})
  `
}

export async function getPledge(reference: string): Promise<BankPledge | null> {
  try {
    const [row] = await sql`
      SELECT bt.*, d.cert_id AS donation_cert_id
      FROM bank_transfers bt
      LEFT JOIN donations d ON d.id = bt.donation_id
      WHERE bt.reference = ${reference}
      LIMIT 1
    `
    return row ? mapRow(row) : null
  } catch (err) {
    console.error('[bank pledge load]', err)
    return null
  }
}

// Read-then-full-UPDATE (same convention as app/api/admin/testimonials).
// Returns the updated pledge, or null if no pledge with that reference exists.
export async function updatePledge(
  reference: string,
  patch: Partial<Pick<BankPledge, 'status' | 'declared_at' | 'confirmed_at' | 'donation_id'>>,
): Promise<BankPledge | null> {
  const [existing] = await sql`SELECT * FROM bank_transfers WHERE reference = ${reference}`
  if (!existing) return null

  const [row] = await sql`
    UPDATE bank_transfers SET
      status       = ${patch.status ?? existing.status},
      declared_at  = ${patch.declared_at ?? existing.declared_at},
      confirmed_at = ${patch.confirmed_at ?? existing.confirmed_at},
      donation_id  = ${patch.donation_id ?? existing.donation_id}
    WHERE reference = ${reference}
    RETURNING *
  `
  return mapRow(row)
}
