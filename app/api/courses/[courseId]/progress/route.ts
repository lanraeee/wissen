import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { getCourse } from '@/lib/courses'
import { getPostHogClient } from '@/lib/posthog-server'
import { sendCertificateEmail } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'

const ProgressSchema = z.object({
  moduleId: z.number().int().nonnegative(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await params
  const rows = await sql`
    SELECT module_id, completed_at FROM course_progress
    WHERE user_id = ${session.id} AND course_id = ${courseId}
    ORDER BY module_id
  `
  const certificate = await sql`
    SELECT certificate_id, issued_at FROM certificates
    WHERE user_id = ${session.id} AND course_id = ${courseId}
  `
  return NextResponse.json({ completedModules: rows, certificate: certificate[0] ?? null })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await params
  const { data, error } = await parseBody(req, ProgressSchema)
  if (error) return error
  const { moduleId } = data

  await sql`
    INSERT INTO course_progress (user_id, course_id, module_id)
    VALUES (${session.id}, ${courseId}, ${moduleId})
    ON CONFLICT (user_id, course_id, module_id) DO NOTHING
  `

  // Check if all modules are complete — award certificate
  const course = await getCourse(courseId)
  if (course) {
    const completedRows = await sql`
      SELECT module_id FROM course_progress
      WHERE user_id = ${session.id} AND course_id = ${courseId}
    `
    const completedIds = new Set(completedRows.map(r => r.module_id as number))
    const allComplete = course.modules.every(m => completedIds.has(m.id))

    if (allComplete) {
      const certId = `WH-${courseId.toUpperCase()}-${session.id.slice(0, 8).toUpperCase()}`
      const [inserted] = await sql`
        INSERT INTO certificates (user_id, course_id, certificate_id)
        VALUES (${session.id}, ${courseId}, ${certId})
        ON CONFLICT (user_id, course_id) DO NOTHING
        RETURNING id
      `

      // Only the first time this certificate is actually issued — avoids
      // re-emailing/re-tracking on every subsequent completion request.
      if (inserted) {
        sendCertificateEmail(session.email, session.name, course.title, certId)
          .catch(err => log.error('certificate email', err))

        const posthog = getPostHogClient()
        posthog.capture({
          distinctId: session.id,
          event: 'course_certificate_awarded',
          properties: {
            course_id: courseId,
            course_title: course.title,
            certificate_id: certId,
            module_count: course.modules.length,
          },
        })
        await posthog.flush()
      }

      return NextResponse.json({ success: true, certificateAwarded: true, certificateId: certId })
    }
  }

  return NextResponse.json({ success: true, certificateAwarded: false })
}
