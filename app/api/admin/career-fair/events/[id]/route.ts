import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const BoothSchema = z.object({
  id: z.string().max(50),
  name: z.string().trim().min(1).max(200),
  category: z.string().max(100),
  location: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
})

const EventUpdateSchema = z.object({
  slug: z.string().trim().min(1).max(200).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  school: z.string().max(300).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
  event_date: z.string().max(30).nullable().optional(),
  event_time: z.string().max(100).nullable().optional(),
  status: z.enum(['draft', 'published', 'closed']).optional(),
  description: z.string().max(5000).nullable().optional(),
  booths: z.array(BoothSchema).max(100).optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const [row] = await sql`SELECT * FROM fair_events WHERE id = ${id}`
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ event: row })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { data: fields, error } = await parseBody(req, EventUpdateSchema)
  if (error) return error

  const [existing] = await sql`SELECT * FROM fair_events WHERE id = ${id}`
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const slug = fields.slug ?? existing.slug
  const title = fields.title ?? existing.title
  const school = fields.school !== undefined ? fields.school : existing.school
  const location = fields.location !== undefined ? fields.location : existing.location
  const eventDate = fields.event_date !== undefined ? fields.event_date : existing.event_date
  const eventTime = fields.event_time !== undefined ? fields.event_time : existing.event_time
  const status = fields.status ?? existing.status
  const description = fields.description !== undefined ? fields.description : existing.description
  const booths = fields.booths !== undefined ? fields.booths : existing.booths

  const [row] = await sql`
    UPDATE fair_events SET
      slug = ${slug}, title = ${title}, school = ${school}, location = ${location},
      event_date = ${eventDate}, event_time = ${eventTime}, status = ${status},
      description = ${description}, booths = ${JSON.stringify(booths)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  logActivity(session, 'fair_event.update', { targetType: 'fair_event', targetId: id })
  return NextResponse.json({ event: row })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM fair_events WHERE id = ${id}`
  logActivity(session, 'fair_event.delete', { targetType: 'fair_event', targetId: id })
  return NextResponse.json({ ok: true })
}
