import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

// Pending-count-per-type, used to badge the Submissions nav item and each
// tab within the Submissions page -- lets staff see what needs attention
// without opening every tab, which matters most at a glance on mobile.
export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await sql`
    SELECT type, COUNT(*)::int AS count
    FROM submissions
    WHERE status = 'pending' OR status IS NULL
    GROUP BY type
  `
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.type as string] = r.count as number
  return NextResponse.json(counts)
}
