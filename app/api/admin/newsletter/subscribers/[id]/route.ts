import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

const ActionSchema = z.object({ status: z.enum(['subscribed', 'unsubscribed']) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { id } = await params
  const { data, error } = await parseBody(req, ActionSchema)
  if (error) return error

  const [row] = await sql`
    UPDATE newsletter_subscribers
    SET status = ${data.status}, unsubscribed_at = ${data.status === 'unsubscribed' ? new Date().toISOString() : null}
    WHERE id = ${id}
    RETURNING id
  `
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logActivity(session, 'newsletter.set_subscriber_status', { targetType: 'newsletter_subscriber', targetId: id, details: { status: data.status } })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { id } = await params
  const [row] = await sql`DELETE FROM newsletter_subscribers WHERE id = ${id} RETURNING email`
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logActivity(session, 'newsletter.delete_subscriber', { targetType: 'newsletter_subscriber', targetId: id, details: { email: row.email } })
  return NextResponse.json({ success: true })
}
