import { NextResponse } from 'next/server'
import { adminGuard, isDirector } from '@/lib/admin-guard'
import sql from '@/lib/db'

const LIMIT = 150

// Site-wide feed of admin_activity_log, filtered by the same three-tier
// model used for per-user activity viewing (app/api/admin/users/[id]/activity):
// a director sees everything; an admin sees editors' actions plus their own
// (never another admin's or a director's); an editor sees only their own --
// "editors cannot audit each other" applies here too.
export async function GET() {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const viewerIsDirector = isDirector(session.email)

  const entries = viewerIsDirector
    ? await sql`SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT ${LIMIT}`
    : session.role === 'admin'
      ? await sql`
          SELECT * FROM admin_activity_log
          WHERE actor_role = 'editor' OR actor_id = ${session.id}
          ORDER BY created_at DESC LIMIT ${LIMIT}
        `
      : await sql`
          SELECT * FROM admin_activity_log WHERE actor_id = ${session.id}
          ORDER BY created_at DESC LIMIT ${LIMIT}
        `

  const viewerTier = viewerIsDirector ? 'director' : session.role === 'admin' ? 'admin' : 'editor'
  return NextResponse.json({ entries, viewerTier })
}
