import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ensureTestimonialsTable } from '@/lib/testimonials-db'

export async function GET() {
  await ensureTestimonialsTable()
  const rows = await sql`
    SELECT id, name, role, quote, avatar_url, rating, featured, created_at
    FROM testimonials
    WHERE status = 'approved'
    ORDER BY featured DESC, sort_order ASC, created_at DESC
    LIMIT 24
  `
  return NextResponse.json({ testimonials: rows })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Please log in to share your story.' }, { status: 401 })

  await ensureTestimonialsTable()
  const body = await req.json()
  const quote = (body.quote ?? '').toString().trim()
  const role = (body.role ?? '').toString().trim() || null

  if (!quote) return NextResponse.json({ error: 'A quote is required.' }, { status: 400 })
  if (quote.length > 1000) return NextResponse.json({ error: 'Quote is too long (max 1000 characters).' }, { status: 400 })

  const [row] = await sql`
    INSERT INTO testimonials (name, role, quote, source, status, user_id)
    VALUES (${session.name}, ${role}, ${quote}, 'candidate', 'pending', ${session.id})
    RETURNING id, name, role, quote, status, created_at
  `
  return NextResponse.json({ testimonial: row }, { status: 201 })
}
