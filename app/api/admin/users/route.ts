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
  const page = parseInt(new URL(req.url).searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit

  const [rows, count] = await Promise.all([
    sql`SELECT id, first_name, last_name, email, membership_expiry, created_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    sql`SELECT COUNT(*) AS c FROM users`,
  ])
  return NextResponse.json({ users: rows, total: Number(count[0].c), page, limit })
}
