import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

export async function GET() {
  const session = (await userAdminGuard() || await sectionGuard('newsletter'))
  if (!session) return forbidden()

  const templates = await sql`SELECT * FROM newsletter_templates ORDER BY updated_at DESC`
  return NextResponse.json({ templates })
}

const TemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  subject: z.string().trim().max(300).default(''),
  body: z.string().max(50000).default(''),
})

export async function POST(req: NextRequest) {
  const session = (await userAdminGuard() || await sectionGuard('newsletter'))
  if (!session) return forbidden()

  const { data, error } = await parseBody(req, TemplateSchema)
  if (error) return error

  const [row] = await sql`
    INSERT INTO newsletter_templates (name, subject, body)
    VALUES (${data.name}, ${data.subject}, ${data.body})
    RETURNING id
  `
  logActivity(session, 'newsletter.create_template', { targetType: 'newsletter_template', targetId: row.id, details: { name: data.name } })
  return NextResponse.json({ success: true, id: row.id }, { status: 201 })
}
