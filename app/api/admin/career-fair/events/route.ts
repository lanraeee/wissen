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

const EventCreateSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(300),
  school: z.string().max(300).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
  event_date: z.string().max(30).nullable().optional(),
  event_time: z.string().max(100).nullable().optional(),
  status: z.enum(['draft', 'published', 'closed']).optional(),
  description: z.string().max(5000).nullable().optional(),
  booths: z.array(BoothSchema).max(100).optional(),
})

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const events = await sql`
    SELECT e.*, COUNT(r.id)::int AS registration_count, COUNT(r.id) FILTER (WHERE r.checked_in)::int AS checked_in_count
    FROM fair_events e
    LEFT JOIN fair_registrations r ON r.event_id = e.id
    GROUP BY e.id
    ORDER BY e.event_date DESC NULLS LAST, e.created_at DESC
  `
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, EventCreateSchema)
  if (error) return error
  const {
    title, school = null, location = null, event_date = null, event_time = null,
    status = 'draft', description = null, booths = [],
  } = data
  const slug = data.slug ? slugify(data.slug) : slugify(title)

  const [row] = await sql`
    INSERT INTO fair_events (slug, title, school, location, event_date, event_time, status, description, booths)
    VALUES (${slug}, ${title}, ${school}, ${location}, ${event_date}, ${event_time}, ${status}, ${description}, ${JSON.stringify(booths)})
    RETURNING *
  `
  logActivity(session, 'fair_event.create', { targetType: 'fair_event', targetId: String(row.id), details: { title, slug } })
  return NextResponse.json({ event: row }, { status: 201 })
}
