import { NextRequest, NextResponse } from 'next/server'
import { adminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await adminGuard() || await sectionGuard('support'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? 'open'
  const rows = status === 'all'
    ? await sql`
        SELECT t.*, (SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t ORDER BY t.last_activity DESC LIMIT 200`
    : await sql`
        SELECT t.*, (SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t WHERE t.status = ${status}
        ORDER BY t.last_activity DESC LIMIT 200`

  return NextResponse.json({ tickets: rows })
}
