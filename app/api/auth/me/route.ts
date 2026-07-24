import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null }, { status: 401 })

  try {
    const [streak] = await sql`
      SELECT streak_count, last_visit FROM visit_streaks WHERE user_id = ${session.id}
    `
    const completedModules = await sql`
      SELECT course_id, module_id FROM course_progress WHERE user_id = ${session.id}
    `
    const certificates = await sql`
      SELECT course_id, certificate_id, issued_at FROM certificates WHERE user_id = ${session.id}
    `
    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        membershipExpiry: session.membershipExpiry,
      },
      streak: streak?.streak_count ?? 0,
      completedModules,
      certificates,
    })
  } catch (err) {
    console.error('[me]', err)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
