import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ensureTestimonialsTable } from '@/lib/testimonials-db'
import { sendTestimonialNotification } from '@/lib/email'
import { parseBody } from '@/lib/validation'

const TestimonialSchema = z.object({
  quote: z.string().trim().min(1).max(1000),
  role: z.string().trim().max(100).optional(),
})

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
  const { data, error } = await parseBody(req, TestimonialSchema)
  if (error) return error
  const { quote } = data
  const role = data.role || null

  const [row] = await sql`
    INSERT INTO testimonials (name, role, quote, source, status, user_id)
    VALUES (${session.name}, ${role}, ${quote}, 'candidate', 'pending', ${session.id})
    RETURNING id, name, role, quote, status, created_at
  `

  sendTestimonialNotification({ name: session.name, role, quote })
    .catch(err => console.error('[testimonial notification]', err))

  return NextResponse.json({ testimonial: row }, { status: 201 })
}
