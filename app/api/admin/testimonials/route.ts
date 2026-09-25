import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { ensureTestimonialsTable } from '@/lib/testimonials-db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const TestimonialCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().max(100).nullable().optional(),
  quote: z.string().trim().min(1).max(1000),
  avatar_url: z.string().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  status: z.enum(['approved', 'pending', 'rejected']).optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

const TestimonialUpdateSchema = TestimonialCreateSchema.partial().extend({
  id: z.union([z.string(), z.number()]),
})

const IdSchema = z.object({ id: z.union([z.string(), z.number()]) })

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTestimonialsTable()
  const rows = await sql`SELECT * FROM testimonials ORDER BY created_at DESC`
  return NextResponse.json({ testimonials: rows })
}

export async function POST(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTestimonialsTable()
  const { data: body, error } = await parseBody(req, TestimonialCreateSchema)
  if (error) return error
  const {
    name, role = null, quote, avatar_url = null, rating = null,
    status = 'approved', featured = false, sort_order = 0,
  } = body

  const [row] = await sql`
    INSERT INTO testimonials (name, role, quote, avatar_url, rating, source, status, featured, sort_order)
    VALUES (${name}, ${role}, ${quote}, ${avatar_url}, ${rating}, 'admin', ${status}, ${featured}, ${sort_order})
    RETURNING *
  `
  logActivity(session, 'testimonial.create', { targetType: 'testimonial', targetId: String(row.id), details: { name } })
  return NextResponse.json({ testimonial: row }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: body, error } = await parseBody(req, TestimonialUpdateSchema)
  if (error) return error
  const { id, ...fields } = body as Record<string, unknown>

  const [existing] = await sql`SELECT * FROM testimonials WHERE id = ${id}`
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [row] = await sql`
    UPDATE testimonials SET
      name       = ${fields.name ?? existing.name},
      role       = ${fields.role !== undefined ? fields.role : existing.role},
      quote      = ${fields.quote ?? existing.quote},
      avatar_url = ${fields.avatar_url !== undefined ? fields.avatar_url : existing.avatar_url},
      rating     = ${fields.rating !== undefined ? fields.rating : existing.rating},
      status     = ${fields.status ?? existing.status},
      featured   = ${fields.featured !== undefined ? fields.featured : existing.featured},
      sort_order = ${fields.sort_order !== undefined ? fields.sort_order : existing.sort_order},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  logActivity(session, 'testimonial.update', { targetType: 'testimonial', targetId: String(id) })
  return NextResponse.json({ testimonial: row })
}

export async function DELETE(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await parseBody(req, IdSchema)
  if (error) return error
  const { id } = data
  await sql`DELETE FROM testimonials WHERE id = ${id}`
  logActivity(session, 'testimonial.delete', { targetType: 'testimonial', targetId: String(id) })
  return NextResponse.json({ ok: true })
}
