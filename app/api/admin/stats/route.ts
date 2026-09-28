import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [users, contact, volunteer, partner, donation, certs, progress, opps] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM users`,
    sql`SELECT COUNT(*) AS c FROM contact_messages`,
    sql`SELECT COUNT(*) AS c FROM volunteer_applications`,
    sql`SELECT COUNT(*) AS c FROM partner_inquiries`,
    sql`SELECT COUNT(*) AS c FROM donations`,
    sql`SELECT COUNT(*) AS c FROM certificates`,
    sql`SELECT COUNT(DISTINCT user_id) AS c FROM course_progress`,
    sql`SELECT COUNT(*) AS c FROM opportunities`,
  ])

  return NextResponse.json({
    users: Number(users[0].c),
    certificates: Number(certs[0].c),
    activelearners: Number(progress[0].c),
    opportunities: Number(opps[0].c),
    submissions: {
      contact: Number(contact[0].c),
      volunteer: Number(volunteer[0].c),
      partner: Number(partner[0].c),
      donation: Number(donation[0].c),
    },
  })
}
