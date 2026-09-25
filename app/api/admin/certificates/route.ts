import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { COURSES } from '@/lib/courseData'
import { sendCertificateEmail } from '@/lib/email'
import { parseBody, zEmail } from '@/lib/validation'

const IssueCertSchema = z.object({
  email: zEmail,
  courseId: z.string().trim().min(1).max(100),
  markComplete: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await parseBody(req, IssueCertSchema)
  if (error) return error
  const { email, courseId, markComplete } = data

  const course = COURSES.find(c => c.id === courseId)
  if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })

  const users = await sql`SELECT id, first_name, last_name FROM users WHERE email = ${email.toLowerCase().trim()}`
  if (!users[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userId = users[0].id as string
  const userName = `${users[0].first_name} ${users[0].last_name}`

  // Optionally mark all modules as complete first -- one bulk insert instead
  // of one round trip per module.
  if (markComplete && course.modules.length > 0) {
    const moduleIds = course.modules.map(m => m.id)
    await sql`
      INSERT INTO course_progress (user_id, course_id, module_id)
      SELECT ${userId}, ${courseId}, id FROM UNNEST(${moduleIds}::int[]) AS id
      ON CONFLICT (user_id, course_id, module_id) DO NOTHING
    `
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

  sendCertificateEmail(email, userName, course.title, certId)
    .catch(err => console.error('[admin certificate email]', err))

  return NextResponse.json({ success: true, certificateId: certId, alreadyExisted: false })
}
