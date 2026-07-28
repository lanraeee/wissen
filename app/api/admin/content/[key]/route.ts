import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { key } = await params
  const rows = await sql`SELECT value FROM site_content WHERE key = ${key}`
  return NextResponse.json({ value: rows[0]?.value ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { key } = await params
  const { value } = await req.json()
  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
  `
  return NextResponse.json({ success: true })
}
