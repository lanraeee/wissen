import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const StatusSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'shortlisted', 'awarded', 'declined', 'waitlisted']),
})
const IdSchema = z.object({ id: z.string() })

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await sql`
    SELECT id, name, email, phone, age_range, country, state_region, city,
           answers, score, score_breakdown, red_flags, status, created_at
    FROM scholarship_applications
    ORDER BY score DESC, created_at DESC
    LIMIT 500
  `
  return NextResponse.json(rows)
}

export async function PATCH(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, StatusSchema)
  if (error) return error
  await sql`UPDATE scholarship_applications SET status = ${data.status} WHERE id = ${data.id}`
  logActivity(session, 'scholarship.status_change', { targetType: 'scholarship_application', targetId: data.id, details: { status: data.status } })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, IdSchema)
  if (error) return error
  await sql`DELETE FROM scholarship_applications WHERE id = ${data.id}`
  logActivity(session, 'scholarship.delete', { targetType: 'scholarship_application', targetId: data.id })
  return NextResponse.json({ success: true })
}
