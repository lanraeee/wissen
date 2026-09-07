import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { ensureTestimonialsTable } from '@/lib/testimonials-db'

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTestimonialsTable()
  const rows = await sql`SELECT * FROM testimonials ORDER BY created_at DESC`
  return NextResponse.json({ testimonials: rows })
}

export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTestimonialsTable()
  const body = await req.json()
  const {
    name, role = null, quote, avatar_url = null, rating = null,
    status = 'approved', featured = false, sort_order = 0,
  } = body

  if (!name || !quote) return NextResponse.json({ error: 'name and quote are required' }, { status: 400 })

  const [row] = await sql`
    INSERT INTO testimonials (name, role, quote, avatar_url, rating, source, status, featured, sort_order)
    VALUES (${name}, ${role}, ${quote}, ${avatar_url}, ${rating}, 'admin', ${status}, ${featured}, ${sort_order})
    RETURNING *
  `
  return NextResponse.json({ testimonial: row }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

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
  return NextResponse.json({ testimonial: row })
}

export async function DELETE(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await sql`DELETE FROM testimonials WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
