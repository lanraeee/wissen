import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { EMAIL_TEMPLATES_BY_ID } from '@/lib/email-catalog'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

const TemplateSchema = z.object({
  subject: z.string().trim().min(1).max(500),
  html: z.string().max(200_000),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await userAdminGuard() || await sectionGuard('email_templates'))
  if (!session) return forbidden()

  const { id } = await params
  if (!EMAIL_TEMPLATES_BY_ID[id]) return NextResponse.json({ error: 'Unknown template' }, { status: 404 })

  const { data, error } = await parseBody(req, TemplateSchema)
  if (error) return error

  await sql`
    INSERT INTO email_templates (id, subject, html, updated_at)
    VALUES (${id}, ${data.subject}, ${data.html}, NOW())
    ON CONFLICT (id) DO UPDATE SET subject = ${data.subject}, html = ${data.html}, updated_at = NOW()
  `
  logActivity(session, 'email_template.update', { targetType: 'email_template', targetId: id })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await userAdminGuard() || await sectionGuard('email_templates'))
  if (!session) return forbidden()

  const { id } = await params
  await sql`DELETE FROM email_templates WHERE id = ${id}`
  logActivity(session, 'email_template.reset', { targetType: 'email_template', targetId: id })
  return NextResponse.json({ success: true })
}
