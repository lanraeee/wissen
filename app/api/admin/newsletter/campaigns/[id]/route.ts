import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

const CampaignSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().max(50000),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await userAdminGuard() || await sectionWriteGuard('newsletter'))
  if (!session) return forbidden()

  const { id } = await params
  const { data, error } = await parseBody(req, CampaignSchema)
  if (error) return error

  const [existing] = await sql`SELECT status FROM newsletter_campaigns WHERE id = ${id}`
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'draft') return NextResponse.json({ error: 'Only draft campaigns can be edited' }, { status: 400 })

  await sql`UPDATE newsletter_campaigns SET subject = ${data.subject}, body = ${data.body} WHERE id = ${id}`
  logActivity(session, 'newsletter.update_campaign', { targetType: 'newsletter_campaign', targetId: id })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await userAdminGuard() || await sectionWriteGuard('newsletter'))
  if (!session) return forbidden()

  const { id } = await params
  const [existing] = await sql`SELECT status FROM newsletter_campaigns WHERE id = ${id}`
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status === 'sending') return NextResponse.json({ error: 'Cannot delete a campaign that is currently sending' }, { status: 400 })

  await sql`DELETE FROM newsletter_campaigns WHERE id = ${id}`
  logActivity(session, 'newsletter.delete_campaign', { targetType: 'newsletter_campaign', targetId: id })
  return NextResponse.json({ success: true })
}
