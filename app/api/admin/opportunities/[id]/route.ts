import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
}

const OpportunityUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.string().trim().min(1).max(50),
  company: z.string().trim().max(200).optional(),
  url: z.string().trim().min(1).max(1000),
  date_posted: z.string().max(30).optional(),
  eligibility: z.enum(['nigeria', 'africa', 'worldwide']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const result = await sql`SELECT * FROM opportunities WHERE id = ${id}`
  if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result[0])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { data: body, error } = await parseBody(req, OpportunityUpdateSchema)
  if (error) return error

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
  logActivity(session, 'opportunity.update', { targetType: 'opportunity', targetId: id })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM opportunities WHERE id = ${id}`
  logActivity(session, 'opportunity.delete', { targetType: 'opportunity', targetId: id })
  return NextResponse.json({ success: true })
}
