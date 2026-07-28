import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [users, subs, certs, progress, opps] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM users`,
    sql`SELECT type, COUNT(*) AS c FROM submissions GROUP BY type`,
    sql`SELECT COUNT(*) AS c FROM certificates`,
    sql`SELECT COUNT(DISTINCT user_id) AS c FROM course_progress`,
    sql`SELECT COUNT(*) AS c FROM opportunities`,
  ])

  const subMap: Record<string, number> = {}
  for (const r of subs) subMap[r.type as string] = Number(r.c)

  return NextResponse.json({
    users: Number(users[0].c),
    certificates: Number(certs[0].c),
    activelearners: Number(progress[0].c),
    opportunities: Number(opps[0].c),
    submissions: {
      contact: subMap.contact ?? 0,
      volunteer: subMap.volunteer ?? 0,
      partner: subMap.partner ?? 0,
      donation: subMap.donation ?? 0,
    },
  })
}
