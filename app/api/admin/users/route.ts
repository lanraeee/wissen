import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

async function guard() {
  const session = await getSession()
  if (!session) return null
  const isDirector = session.email === ADMIN_EMAIL
  const hasAccess = isDirector || session.role === 'admin' || session.role === 'editor'
  return hasAccess ? session : null
}

export async function GET(req: NextRequest) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const page = parseInt(new URL(req.url).searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit

  const [rows, count] = await Promise.all([
    sql`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.membership_expiry, u.created_at,
        (SELECT COUNT(*) FROM course_progress cp WHERE cp.user_id = u.id)::int AS modules_done,
        (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id)::int AS certs
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*) AS c FROM users`,
  ])
  const viewerIsDirector = session!.email === ADMIN_EMAIL
  return NextResponse.json({ users: rows, total: Number(count[0].c), page, limit, viewerIsDirector })
}
