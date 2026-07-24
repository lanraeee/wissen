import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'

export async function GET() {
  const s = await getSession()
  if (s?.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [certs, progress, byUser] = await Promise.all([
    sql`
      SELECT c.id, c.certificate_id, c.course_id, c.issued_at,
        u.first_name, u.last_name, u.email
      FROM certificates c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.issued_at DESC LIMIT 200
    `,
    sql`
      SELECT cp.course_id, cp.module_id, cp.completed_at,
        u.first_name, u.last_name, u.email
      FROM course_progress cp
      JOIN users u ON u.id = cp.user_id
      ORDER BY cp.completed_at DESC LIMIT 200
    `,
    sql`
      SELECT u.first_name, u.last_name, u.email,
        COUNT(DISTINCT cp.course_id)::int AS courses,
        COUNT(cp.id)::int AS modules,
        COUNT(DISTINCT c.id)::int AS certs
      FROM users u
      LEFT JOIN course_progress cp ON cp.user_id = u.id
      LEFT JOIN certificates c ON c.user_id = u.id
      GROUP BY u.id, u.first_name, u.last_name, u.email
      HAVING COUNT(cp.id) > 0
      ORDER BY modules DESC
      LIMIT 100
    `,
  ])

  return NextResponse.json({ certs, progress, byUser })
}
