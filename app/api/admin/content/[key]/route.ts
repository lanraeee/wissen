import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, directorGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'

// site_content.value shape varies per key by design (each admin editor owns
// its own shape) so this stays a generic JSON blob rather than a per-key
// schema — bounded in size to stop this generic endpoint being used to
// stuff arbitrary large payloads into the database.
const ContentSchema = z.object({
  value: z.unknown().refine(
    v => JSON.stringify(v).length <= 500_000,
    { message: 'value is too large' }
  ),
})

// Most site_content keys hold public copy, and adminGuard() — which admits the
// `editor` role — is the right gate for those. These keys do not: they hold the
// bank account donors are told to pay into. An editor able to rewrite this key
// could silently redirect every bank-transfer donation, with the foundation's
// own name and branding still attached to the instructions email. Require the
// director for them, matching how role assignment is already restricted.
const DIRECTOR_ONLY_KEYS = new Set(['bank_transfer_details'])

function guardFor(key: string) {
  return DIRECTOR_ONLY_KEYS.has(key) ? directorGuard() : adminGuard()
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!await guardFor(key)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await sql`SELECT value FROM site_content WHERE key = ${key}`
  return NextResponse.json({ value: rows[0]?.value ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!await guardFor(key)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, ContentSchema)
  if (error) return error
  const { value } = data
  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
  `
  return NextResponse.json({ success: true })
}
