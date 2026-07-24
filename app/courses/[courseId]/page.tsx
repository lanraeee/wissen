import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COURSES } from '@/lib/courseData'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

interface Props {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params
  const course = COURSES.find(c => c.id === courseId)
  if (!course) return { title: 'Course Not Found' }
  return { title: `${course.title} · Wissen-Haus`, description: course.tagline }
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params
  const course = COURSES.find(c => c.id === courseId)
  if (!course) notFound()

  const session = await getSession()
  let completedIds = new Set<number>()
  let certificate = null

  if (session) {
    const rows = await sql`SELECT module_id FROM course_progress WHERE user_id = ${session.id} AND course_id = ${courseId}`
    completedIds = new Set(rows.map(r => r.module_id as number))
    const certs = await sql`SELECT certificate_id FROM certificates WHERE user_id = ${session.id} AND course_id = ${courseId}`
    certificate = certs[0] ?? null
  }

  const totalModules = course.modules.length
  const completedCount = completedIds.size
  const progress = Math.round((completedCount / totalModules) * 100)

  return (
    <>
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <span className="eyebrow eyebrow--light">Course</span>
          <h1 className="display-lg mt-s" style={{ color: '#fff' }}>{course.title}</h1>
          <p className="lead mt-s" style={{ color: 'rgba(244,240,231,.78)' }}>{course.tagline}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', alignItems: 'center' }}>
            {course.isPremium ? (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 'var(--pill)', padding: '.4em .9em', fontFamily: 'var(--ff-mono)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>Premium</span>
            ) : (
              <span className="badge-free">Free</span>
            )}
            <span style={{ color: 'rgba(244,240,231,.65)', fontFamily: 'var(--ff-mono)', fontSize: '.8rem' }}>{totalModules} modules</span>
            {certificate && (
              <Link href={`/courses/${courseId}/certificate`} className="btn btn--light btn--sm">View Certificate</Link>
            )}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          {session && (
            <div className="course-progress mb-m">
              <span className="course-progress__label">{completedCount} / {totalModules} modules completed</span>
              <div className="course-progress__bar">
                <div className="course-progress__fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="module-list">
            {course.modules.map((mod, i) => {
              const done = completedIds.has(mod.id)
              return (
                <Link key={mod.id} href={`/courses/${courseId}/modules/${mod.id}`} className={`module${done ? ' module--complete' : ''}`} style={{ textDecoration: 'none' }}>
                  <div className="module__header">
                    <div className="module__check">
                      <div className="module__check-box" style={done ? { background: 'var(--green-800)', borderColor: 'var(--green-800)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
                        {done ? '✓' : ''}
                      </div>
                    </div>
                    <h3 className="module__title">Module {mod.id}: {mod.title}</h3>
                  </div>
                  <div className="module__body">
                    <p style={{ color: 'var(--ink-60)', fontSize: '.95rem' }}>{mod.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          {!session && (
            <div style={{ marginTop: '2rem', background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Sign in to track your progress and earn a certificate.</p>
              <Link href="/login" className="btn">Sign In / Join Free</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
