import sql from './db'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const MAX_SIGNATURE_BYTES = 300_000
const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/
const PNG_MAGIC = 'iVBORw0KGgo'

export interface SavedSignature {
  id: string
  name: string
  image_data: string
  owner_email: string
  created_at: string
}

/** True only for a PNG data URL (what SignaturePad produces) within the size cap. Keeps arbitrary markup/URLs out of an <img src> that is later printed on certificates. */
export function isValidSignatureImage(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > MAX_SIGNATURE_BYTES) return false
  const m = PNG_DATA_URL.exec(v)
  return !!m && m[1].startsWith(PNG_MAGIC)
}

export function cleanSignatureName(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 80) : ''
}

let ensured = false
export async function ensureSignaturesTable() {
  if (ensured) return
  await sql`
    CREATE TABLE IF NOT EXISTS saved_signatures (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      image_data  TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  ensured = true
}

export async function listSignatures(ownerEmail: string | null): Promise<SavedSignature[]> {
  await ensureSignaturesTable()
  const rows = ownerEmail
    ? await sql`SELECT id, name, image_data, owner_email, created_at FROM saved_signatures WHERE lower(owner_email) = ${ownerEmail.toLowerCase()} ORDER BY created_at DESC`
    : await sql`SELECT id, name, image_data, owner_email, created_at FROM saved_signatures ORDER BY created_at DESC`
  return rows as unknown as SavedSignature[]
}

export async function createSignature(ownerEmail: string, name: string, imageData: string): Promise<SavedSignature> {
  await ensureSignaturesTable()
  const rows = await sql`
    INSERT INTO saved_signatures (name, image_data, owner_email)
    VALUES (${name}, ${imageData}, ${ownerEmail.toLowerCase()})
    RETURNING id, name, image_data, owner_email, created_at
  `
  return rows[0] as unknown as SavedSignature
}

export async function deleteSignature(id: string, ownerEmail: string | null): Promise<boolean> {
  await ensureSignaturesTable()
  const rows = ownerEmail
    ? await sql`DELETE FROM saved_signatures WHERE id = ${id} AND lower(owner_email) = ${ownerEmail.toLowerCase()} RETURNING id`
    : await sql`DELETE FROM saved_signatures WHERE id = ${id} RETURNING id`
  return rows.length > 0
}

/** Image for a signature chosen as a certificate signatory, read server-side by the public certificate pages. Returns null for unknown ids or if the table does not exist yet. */
export async function getSignatureImage(id: unknown): Promise<string | null> {
  if (typeof id !== 'string' || !UUID_RE.test(id)) return null
  try {
    await ensureSignaturesTable()
    const rows = await sql`SELECT image_data FROM saved_signatures WHERE id = ${id}`
    const img = rows[0]?.image_data
    return isValidSignatureImage(img) ? img : null
  } catch {
    return null
  }
}
