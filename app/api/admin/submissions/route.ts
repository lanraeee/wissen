import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'

async function guard() {
  const session = await getSession()
  if (!session || session.email !== ADMIN_EMAIL) return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const params = new URL(req.url).searchParams
  const type = params.get('type') || 'contact'
  const rows = await sql`
    SELECT id, type, name, email, phone, data, status, created_at
    FROM submissions
    WHERE type = ${type}
    ORDER BY created_at DESC
    LIMIT 200
  `
  return NextResponse.json(rows)
}

export async function DELETE(req: NextRequest) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await sql`DELETE FROM submissions WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
