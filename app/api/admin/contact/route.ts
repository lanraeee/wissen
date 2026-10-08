import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const StatusSchema = z.object({ id: z.string(), status: z.enum(['pending', 'reviewed', 'actioned']) })
const IdSchema = z.object({ id: z.string() })

export async function GET() {
  if (!(await adminGuard() || await sectionGuard('contact'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await sql`
    SELECT id, name, email, subject, message, status, created_at
    FROM contact_messages ORDER BY created_at DESC LIMIT 200
  `
  return NextResponse.json(rows)
}

export async function PATCH(req: NextRequest) {
  const session = (await adminGuard() || await sectionWriteGuard('contact'))
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, StatusSchema)
  if (error) return error
  await sql`UPDATE contact_messages SET status = ${data.status} WHERE id = ${data.id}`
  logActivity(session, 'contact.status_change', { targetType: 'contact_message', targetId: data.id, details: { status: data.status } })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = (await adminGuard() || await sectionWriteGuard('contact'))
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, IdSchema)
  if (error) return error
  await sql`DELETE FROM contact_messages WHERE id = ${data.id}`
  logActivity(session, 'contact.delete', { targetType: 'contact_message', targetId: data.id })
  return NextResponse.json({ success: true })
}
