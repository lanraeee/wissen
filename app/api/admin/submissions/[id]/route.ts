import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const StatusSchema = z.object({ status: z.enum(['pending', 'reviewed', 'actioned']) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { data, error } = await parseBody(req, StatusSchema)
  if (error) return error
  await sql`UPDATE submissions SET status = ${data.status} WHERE id = ${id}`
  logActivity(session, 'submission.status_change', { targetType: 'submission', targetId: id, details: { status: data.status } })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM submissions WHERE id = ${id}`
  logActivity(session, 'submission.delete', { targetType: 'submission', targetId: id })
  return NextResponse.json({ success: true })
}
