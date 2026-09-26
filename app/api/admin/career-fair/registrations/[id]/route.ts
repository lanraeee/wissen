import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const PatchSchema = z.object({ checkedIn: z.boolean() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { data, error } = await parseBody(req, PatchSchema)
  if (error) return error

  const [row] = await sql`
    UPDATE fair_registrations
    SET checked_in = ${data.checkedIn}, checked_in_at = ${data.checkedIn ? new Date().toISOString() : null}
    WHERE id = ${id}
    RETURNING id, name, checked_in, checked_in_at
  `
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  logActivity(session, data.checkedIn ? 'fair_registration.check_in' : 'fair_registration.undo_check_in', {
    targetType: 'fair_registration', targetId: id,
  })
  return NextResponse.json({ registration: row })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM fair_registrations WHERE id = ${id}`
  logActivity(session, 'fair_registration.delete', { targetType: 'fair_registration', targetId: id })
  return NextResponse.json({ ok: true })
}
