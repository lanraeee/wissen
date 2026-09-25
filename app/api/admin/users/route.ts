import { NextRequest, NextResponse } from 'next/server'
import { userAdminGuard, isDirector } from '@/lib/admin-guard'
import sql from '@/lib/db'

// This returns every user's email address. Editors are content contributors and
// have no need for the membership roll, so they are not admitted here — the
// same boundary the per-user handlers draw.
export async function GET(req: NextRequest) {
  const session = await userAdminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const page = parseInt(new URL(req.url).searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit

  const [rows, count] = await Promise.all([
    sql`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.membership_expiry, u.created_at,
        COALESCE(COUNT(DISTINCT cp.id), 0)::int AS modules_done,
        COALESCE(COUNT(DISTINCT c.id), 0)::int AS certs
      FROM users u
      LEFT JOIN course_progress cp ON cp.user_id = u.id
      LEFT JOIN certificates c ON c.user_id = u.id
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.membership_expiry, u.created_at
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*) AS c FROM users`,
  ])
  const viewerIsDirector = isDirector(session.email)
  return NextResponse.json({ users: rows, total: Number(count[0].c), page, limit, viewerIsDirector })
}
