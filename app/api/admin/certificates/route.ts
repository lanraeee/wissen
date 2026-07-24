import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { COURSES } from '@/lib/courseData'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'
async function guard() {
  const s = await getSession()
  return s?.email === ADMIN_EMAIL ? s : null
}

export async function POST(req: NextRequest) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, courseId, markComplete } = await req.json() as {
    email: string
    courseId: string
    markComplete?: boolean
  }

  if (!email || !courseId) {
    return NextResponse.json({ error: 'email and courseId are required' }, { status: 400 })
  }

  const course = COURSES.find(c => c.id === courseId)
  if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })

  const users = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`
  if (!users[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userId = users[0].id as string

  // Optionally mark all modules as complete first
  if (markComplete) {
    for (const mod of course.modules) {
      await sql`
        INSERT INTO course_progress (user_id, course_id, module_id)
        VALUES (${userId}, ${courseId}, ${mod.id})
        ON CONFLICT (user_id, course_id, module_id) DO NOTHING
      `
    }
  }

  const certId = `WH-${courseId.toUpperCase()}-${userId.slice(0, 8).toUpperCase()}`

  const existing = await sql`
    SELECT certificate_id FROM certificates WHERE user_id = ${userId} AND course_id = ${courseId}
  `
  if (existing[0]) {
    return NextResponse.json({ success: true, certificateId: existing[0].certificate_id, alreadyExisted: true })
  }

  await sql`
    INSERT INTO certificates (user_id, course_id, certificate_id)
    VALUES (${userId}, ${courseId}, ${certId})
  `

  return NextResponse.json({ success: true, certificateId: certId, alreadyExisted: false })
}
