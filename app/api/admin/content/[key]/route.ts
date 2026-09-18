import { NextRequest, NextResponse } from 'next/server'
import { adminGuard, directorGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

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
  const { value } = await req.json()
  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
  `
  return NextResponse.json({ success: true })
}
