import { NextRequest, NextResponse } from 'next/server'
import { userAdminGuard, isDirector } from '@/lib/admin-guard'
import sql from '@/lib/db'

// This returns every user's email address. Editors are content contributors and
// have no need for the membership roll, so they are not admitted here â€” the
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
        (SELECT COUNT(*) FROM course_progress cp WHERE cp.user_id = u.id)::int AS modules_done,
        (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id)::int AS certs
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*) AS c FROM users`,
  ])
  const viewerIsDirector = isDirector(session.email)
  return NextResponse.json({ users: rows, total: Number(count[0].c), page, limit, viewerIsDirector })
}
