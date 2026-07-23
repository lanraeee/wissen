import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { COURSES } from '@/lib/courseData'

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
  const { moduleId } = await req.json()

  if (typeof moduleId !== 'number') {
    return NextResponse.json({ error: 'moduleId must be a number' }, { status: 400 })
  }

  await sql`
    INSERT INTO course_progress (user_id, course_id, module_id)
    VALUES (${session.id}, ${courseId}, ${moduleId})
    ON CONFLICT (user_id, course_id, module_id) DO NOTHING
  `

  // Check if all modules are complete — award certificate
  const course = COURSES.find(c => c.id === courseId)
  if (course) {
    const completedRows = await sql`
      SELECT module_id FROM course_progress
      WHERE user_id = ${session.id} AND course_id = ${courseId}
    `
    const completedIds = new Set(completedRows.map(r => r.module_id as number))
    const allComplete = course.modules.every(m => completedIds.has(m.id))

    if (allComplete) {
      const certId = `WH-${courseId.toUpperCase()}-${session.id.slice(0, 8).toUpperCase()}`
      await sql`
        INSERT INTO certificates (user_id, course_id, certificate_id)
        VALUES (${session.id}, ${courseId}, ${certId})
        ON CONFLICT (user_id, course_id) DO NOTHING
      `
      return NextResponse.json({ success: true, certificateAwarded: true, certificateId: certId })
    }
  }

  return NextResponse.json({ success: true, certificateAwarded: false })
}
