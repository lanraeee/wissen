import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard } from '@/lib/admin-guard'
import { renderPreview } from '@/lib/email-render'
import { parseBody } from '@/lib/validation'

const PreviewSchema = z.object({
  subject: z.string().max(500),
  body: z.string().max(200_000),
})

// Renders a draft campaign/template subject+HTML inside the real email
// shell, exactly as sendNewsletterEmail() would, including a stand-in
// unsubscribe link -- never writes to the database, never sends anything.
export async function POST(req: NextRequest) {
  const session = await userAdminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await parseBody(req, PreviewSchema)
  if (error) return error

  const { subject, html } = await renderPreview(data.subject, data.body, {}, { unsubscribeUrl: '#' })
  return NextResponse.json({ subject, html })
}
