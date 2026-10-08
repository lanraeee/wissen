import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

export async function GET() {
  const session = (await userAdminGuard() || await sectionGuard('newsletter'))
  if (!session) return forbidden()

  const campaigns = await sql`SELECT * FROM newsletter_campaigns ORDER BY created_at DESC`
  return NextResponse.json({ campaigns })
}

const CampaignSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().max(50000),
})

export async function POST(req: NextRequest) {
  const session = (await userAdminGuard() || await sectionWriteGuard('newsletter'))
  if (!session) return forbidden()

  const { data, error } = await parseBody(req, CampaignSchema)
  if (error) return error

  const [row] = await sql`
    INSERT INTO newsletter_campaigns (subject, body)
    VALUES (${data.subject}, ${data.body})
    RETURNING id
  `
  logActivity(session, 'newsletter.create_campaign', { targetType: 'newsletter_campaign', targetId: row.id, details: { subject: data.subject } })
  return NextResponse.json({ success: true, id: row.id }, { status: 201 })
}
