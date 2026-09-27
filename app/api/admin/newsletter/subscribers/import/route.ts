import { NextResponse } from 'next/server'
import { userAdminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { generateUnsubscribeToken } from '@/lib/newsletter'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

// Pulls in everyone who ticked "newsletter" on the Career Fair registration
// form and isn't already a subscriber -- the only other place on the site
// that collects opt-in interest today.
export async function POST() {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const candidates = await sql`
    SELECT DISTINCT ON (LOWER(email)) email, name
    FROM fair_registrations
    WHERE newsletter_opt_in = true AND email IS NOT NULL AND email <> ''
    ORDER BY LOWER(email), created_at DESC
  `

  let imported = 0
  for (const c of candidates) {
    const email = (c.email as string).toLowerCase().trim()
    const [existing] = await sql`SELECT id FROM newsletter_subscribers WHERE email = ${email}`
    if (existing) continue
    await sql`
      INSERT INTO newsletter_subscribers (email, name, source, unsubscribe_token)
      VALUES (${email}, ${c.name || null}, 'career_fair', ${generateUnsubscribeToken()})
    `
    imported++
  }

  logActivity(session, 'newsletter.import_subscribers', { details: { imported, candidates: candidates.length } })
  return NextResponse.json({ success: true, imported })
}
