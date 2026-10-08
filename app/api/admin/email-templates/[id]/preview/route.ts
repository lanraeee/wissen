import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { EMAIL_TEMPLATES_BY_ID } from '@/lib/email-catalog'
import { renderPreview } from '@/lib/email-render'
import { parseBody } from '@/lib/validation'

const PreviewSchema = z.object({
  subject: z.string().max(500),
  html: z.string().max(200_000),
})

// Renders a draft subject/html against this template's sample data -- never
// touches the database, never sends anything. Lets the admin see exactly
// what a real send will look like (shell and all) before saving.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await adminGuard() || await sectionWriteGuard('email_templates'))
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const template = EMAIL_TEMPLATES_BY_ID[id]
  if (!template) return NextResponse.json({ error: 'Unknown template' }, { status: 404 })

  const { data, error } = await parseBody(req, PreviewSchema)
  if (error) return error

  const { subject, html } = renderPreview(data.subject, data.html, template.sampleVars)
  return NextResponse.json({ subject, html })
}
