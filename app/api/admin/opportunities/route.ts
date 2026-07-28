import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
}

export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
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
