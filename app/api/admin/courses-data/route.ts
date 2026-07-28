import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
