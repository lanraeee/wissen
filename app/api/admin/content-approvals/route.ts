import { NextRequest, NextResponse } from 'next/server'
import { adminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

// adminGuard, not directorGuard: an editor needs to see the state of what they
// submitted (still pending, approved, or rejected and why). Acting on a
// request is the director-only part, and that lives in [id]/route.ts.
export async function GET(req: NextRequest) {
  if (!(await adminGuard() || await sectionGuard('content_approvals'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'
  const rows = status === 'all'
    ? await sql`
        SELECT id, content_key, proposed_value, previous_value, status,
               requested_by_email, requested_at, reviewed_by_email, reviewed_at, review_note
        FROM content_change_requests
        ORDER BY requested_at DESC LIMIT 100`
    : await sql`
        SELECT id, content_key, proposed_value, previous_value, status,
               requested_by_email, requested_at, reviewed_by_email, reviewed_at, review_note
        FROM content_change_requests
        WHERE status = ${status}
        ORDER BY requested_at DESC LIMIT 100`

  return NextResponse.json({ requests: rows })
}
