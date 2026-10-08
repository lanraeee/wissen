import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

const TemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  subject: z.string().trim().max(300).default(''),
  body: z.string().max(50000).default(''),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await userAdminGuard() || await sectionWriteGuard('newsletter'))
  if (!session) return forbidden()

  const { id } = await params
  const { data, error } = await parseBody(req, TemplateSchema)
  if (error) return error

  const [row] = await sql`
    UPDATE newsletter_templates SET name = ${data.name}, subject = ${data.subject}, body = ${data.body}, updated_at = NOW()
    WHERE id = ${id} RETURNING id
  `
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logActivity(session, 'newsletter.update_template', { targetType: 'newsletter_template', targetId: id })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await userAdminGuard() || await sectionWriteGuard('newsletter'))
  if (!session) return forbidden()

  const { id } = await params
  const [row] = await sql`DELETE FROM newsletter_templates WHERE id = ${id} RETURNING id`
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logActivity(session, 'newsletter.delete_template', { targetType: 'newsletter_template', targetId: id })
  return NextResponse.json({ success: true })
}
