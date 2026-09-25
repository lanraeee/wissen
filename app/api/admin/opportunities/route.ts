import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
}

const OpportunitySchema = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.string().trim().min(1).max(50),
  company: z.string().trim().max(200).optional(),
  url: z.string().trim().min(1).max(1000),
  date_posted: z.string().max(30).optional(),
  eligibility: z.enum(['nigeria', 'africa', 'worldwide']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
})

export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: body, error } = await parseBody(req, OpportunitySchema)
  if (error) return error
  const id = `manual-${slugify(body.title)}-${Date.now()}`
  const eligLabel = body.eligibility === 'nigeria' ? 'Open to Nigeria'
    : body.eligibility === 'africa' ? 'Open to Africa' : 'Open Worldwide'
  await sql`
    INSERT INTO opportunities (id, type, source, title, company, url, date_posted, first_seen_at, eligibility, eligibility_label, tags, updated_at)
    VALUES (
      ${id}, ${body.type}, 'manual', ${body.title}, ${body.company || null},
      ${body.url}, ${body.date_posted || null}, NOW(),
      ${body.eligibility || 'worldwide'}, ${eligLabel},
      ${body.tags || []}, NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `
  return NextResponse.json({ success: true, id })
}
