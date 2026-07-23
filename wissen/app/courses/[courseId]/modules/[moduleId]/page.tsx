import { notFound } from 'next/navigation'
import { COURSES } from '@/lib/courseData'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import CourseModule from '@/components/CourseModule'
import StreakBadge from '@/components/StreakBadge'
import Link from 'next/link'

interface Props {
  params: Promise<{ courseId: string; moduleId: string }>
}

export default async function ModulePage({ params }: Props) {
  const { courseId, moduleId: moduleIdStr } = await params
  const moduleId = parseInt(moduleIdStr, 10)
  const course = COURSES.find(c => c.id === courseId)
  if (!course) notFound()

  const mod = course.modules.find(m => m.id === moduleId)
  if (!mod) notFound()

  const session = await getSession()
  let isCompleted = false

  if (session) {
    const rows = await sql`
      SELECT 1 FROM course_progress
      WHERE user_id = ${session.id} AND course_id = ${courseId} AND module_id = ${moduleId}
    `
    isCompleted = rows.length > 0
  }

  const modIndex = course.modules.findIndex(m => m.id === moduleId)
  const prevMod = modIndex > 0 ? course.modules[modIndex - 1] : null
  const nextMod = modIndex < course.modules.length - 1 ? course.modules[modIndex + 1] : null

  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <div style={{ marginBottom: '2rem' }}>
            <Link href={`/courses/${courseId}`} style={{ color: 'var(--ink-60)', fontSize: '.9rem', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" /></svg>
              Back to {course.title}
            </Link>
          </div>

          {!session && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius)', padding: '16px', fontSize: '.9rem' }}>
              <Link href="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Sign in</Link> to save your progress and earn a certificate.
            </div>
          )}

          <CourseModule
            courseId={courseId}
            module={mod}
            isCompleted={isCompleted}
            prevModuleId={prevMod?.id}
            nextModuleId={nextMod?.id}
          />
        </div>
      </section>
    </>
  )
}
