import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const result = await sql`SELECT * FROM opportunities WHERE id = ${id}`
  if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result[0])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()

  const eligLabel = body.eligibility === 'nigeria' ? 'Open to Nigeria'
    : body.eligibility === 'africa' ? 'Open to Africa' : 'Open Worldwide'

  await sql`
    UPDATE opportunities
    SET
      type = ${body.type},
      title = ${body.title},
      company = ${body.company || null},
      url = ${body.url},
      date_posted = ${body.date_posted || null},
      eligibility = ${body.eligibility || 'worldwide'},
      eligibility_label = ${eligLabel},
      tags = ${body.tags || []},
      updated_at = NOW()
    WHERE id = ${id}
  `
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM opportunities WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
