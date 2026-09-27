import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { generateUnsubscribeToken } from '@/lib/newsletter'
import { parseBody, zEmail, zName } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

export async function GET() {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const subscribers = await sql`
    SELECT id, email, name, source, status, subscribed_at, unsubscribed_at
    FROM newsletter_subscribers ORDER BY subscribed_at DESC
  `
  return NextResponse.json({ subscribers })
}

const AddSchema = z.object({ email: zEmail, name: zName.optional() })

export async function POST(req: NextRequest) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { data, error } = await parseBody(req, AddSchema)
  if (error) return error
  const email = data.email.toLowerCase().trim()

  const [existing] = await sql`SELECT id, status FROM newsletter_subscribers WHERE email = ${email}`
  if (existing) {
    if (existing.status === 'unsubscribed') {
      await sql`UPDATE newsletter_subscribers SET status = 'subscribed', unsubscribed_at = NULL WHERE id = ${existing.id}`
      logActivity(session, 'newsletter.resubscribe', { targetType: 'newsletter_subscriber', targetId: existing.id })
      return NextResponse.json({ success: true, resubscribed: true })
    }
    return NextResponse.json({ error: 'This email is already subscribed' }, { status: 409 })
  }

  const [row] = await sql`
    INSERT INTO newsletter_subscribers (email, name, source, unsubscribe_token)
    VALUES (${email}, ${data.name || null}, 'admin', ${generateUnsubscribeToken()})
    RETURNING id
  `
  logActivity(session, 'newsletter.add_subscriber', { targetType: 'newsletter_subscriber', targetId: row.id, details: { email } })
  return NextResponse.json({ success: true }, { status: 201 })
}
