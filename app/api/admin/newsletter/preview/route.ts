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
// unsubscribe line -- never touches the database, never sends anything.
export async function POST(req: NextRequest) {
  const session = await userAdminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await parseBody(req, PreviewSchema)
  if (error) return error

  const bodyWithFooter = `${data.body}
<div class="divider"></div>
<p style="font-size:.78rem;color:#8a9a8f">You're receiving this because you're subscribed to Wissen-Haus updates. <a href="#" style="color:#8a9a8f;text-decoration:underline">Unsubscribe</a></p>`

  const { subject, html } = renderPreview(data.subject, bodyWithFooter, {})
  return NextResponse.json({ subject, html })
}
