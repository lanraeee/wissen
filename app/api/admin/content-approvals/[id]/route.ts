import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { directorGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { writeContent } from '@/lib/content-approvals'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'

const ReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(2000).nullish(),
})

// Directors only. This is the step that makes an editor's proposal public, so
// it is deliberately narrower than the guard on the queue itself.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await parseBody(req, ReviewSchema)
  if (error) return error
  const { action, note } = data

  // Claim the row and flip it in one statement: two directors hitting Approve
  // on the same request at the same moment would otherwise both pass a
  // read-then-write check and publish twice. The WHERE status = 'pending'
  // means the loser updates nothing and is told the race was already settled.
  const claimed = await sql`
    UPDATE content_change_requests
    SET status = ${action === 'approve' ? 'approved' : 'rejected'},
        reviewed_by_email = ${session.email},
        reviewed_at = NOW(),
        review_note = ${note || null}
    WHERE id = ${id} AND status = 'pending'
    RETURNING content_key, proposed_value
  `
  if (!claimed.length) {
    return NextResponse.json({ error: 'This request has already been reviewed' }, { status: 409 })
  }

  if (action === 'approve') {
    const { content_key, proposed_value } = claimed[0]
    try {
      await writeContent(content_key, proposed_value)
    } catch (err) {
      // The row is already marked approved but the content did not land.
      // Put it back so it stays visible in the queue rather than silently
      // vanishing as "approved" with nothing published.
      await sql`
        UPDATE content_change_requests
        SET status = 'pending', reviewed_by_email = NULL, reviewed_at = NULL
        WHERE id = ${id}
      `
      log.error('content approval', err)
      return NextResponse.json({ error: 'Could not publish the change' }, { status: 500 })
    }
  }

  logActivity(session, `content.${action}`, { targetType: 'content_change_request', targetId: id })
  return NextResponse.json({ success: true })
}
