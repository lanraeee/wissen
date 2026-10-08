import { NextResponse } from 'next/server'
import { adminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET() {
  if (!(await adminGuard() || await sectionGuard('donations'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await sql`
    SELECT id, name, email, amount, currency, reference, provider, cert_id, created_at
    FROM donations ORDER BY created_at DESC LIMIT 200
  `
  return NextResponse.json(rows)
}
