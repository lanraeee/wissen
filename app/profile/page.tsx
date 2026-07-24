import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { COURSES } from '@/lib/courseData'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'My Profile · Wissen-Haus',
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [streak] = await sql`SELECT streak_count, last_visit FROM visit_streaks WHERE user_id = ${session.id}`
  const completedModules = await sql`SELECT course_id, module_id FROM course_progress WHERE user_id = ${session.id}`
  const certificates = await sql`SELECT course_id, certificate_id, issued_at FROM certificates WHERE user_id = ${session.id}`
  const [user] = await sql`SELECT first_name, last_name, email, created_at, membership_expiry FROM users WHERE id = ${session.id}`

  const completedByCourse: Record<string, number[]> = {}
  completedModules.forEach(r => {
    if (!completedByCourse[r.course_id]) completedByCourse[r.course_id] = []
    completedByCourse[r.course_id].push(r.module_id as number)
  })

  const certsByCourse: Record<string, string> = {}
  certificates.forEach(c => { certsByCourse[c.course_id] = c.certificate_id })

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap">
        <div className="split mb-l">
          <div className="reveal">
            <span className="eyebrow">My Profile</span>
            <h1 className="display-lg mt-s">{user.first_name} {user.last_name}</h1>
            <p className="lead mt-s">{user.email}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--green-100)', borderRadius: 18, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.8rem' }}>🔥</span>
                <div>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.8rem', color: 'var(--red)', lineHeight: 1 }}>{streak?.streak_count ?? 0}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--ink-60)' }}>day streak</div>
                </div>
              </div>
              <div style={{ background: 'var(--green-100)', borderRadius: 18, padding: '12px 20px' }}>
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.8rem', color: 'var(--green-800)', lineHeight: 1 }}>{certificates.length}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--ink-60)' }}>certificates</div>
              </div>
              <div style={{ background: 'var(--green-100)', borderRadius: 18, padding: '12px 20px' }}>
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.8rem', color: 'var(--green-800)', lineHeight: 1 }}>{completedModules.length}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--ink-60)' }}>modules done</div>
              </div>
            </div>
          </div>
          <div className="reveal" data-d="1">
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="h4" style={{ marginBottom: '1rem' }}>Account Details</h3>
              <div className="info-list">
                <div style={{ display: 'flex', gap: '.5rem', fontSize: '.9rem' }}>
                  <span style={{ color: 'var(--ink-60)', minWidth: 100 }}>Joined</span>
                  <span>{new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                {user.membership_expiry && (
                  <div style={{ display: 'flex', gap: '.5rem', fontSize: '.9rem' }}>
                    <span style={{ color: 'var(--ink-60)', minWidth: 100 }}>Membership</span>
                    <span>Active until {new Date(user.membership_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="section-head mb-l reveal">
          <span className="eyebrow">My Learning</span>
          <h2>Course Progress</h2>
        </div>
        <div className="grid grid-2">
          {COURSES.map(course => {
            const done = completedByCourse[course.id]?.length ?? 0
            const total = course.modules.length
            const pct = Math.round((done / total) * 100)
            const cert = certsByCourse[course.id]
            return (
              <div key={course.id} className="card reveal">
                <div className="card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '.8rem' }}>
                    <div>
                      {course.isPremium ? (
                        <span className="card__num" style={{ color: 'var(--red)' }}>PREMIUM</span>
                      ) : (
                        <span className="badge-free">FREE</span>
                      )}
                      <h3 className="h4" style={{ marginTop: '.3rem' }}>{course.title}</h3>
                    </div>
                    {cert && (
                      <Link href={`/courses/${course.id}/certificate`} style={{ fontSize: '.75rem', color: 'var(--green-800)', fontWeight: 600, flexShrink: 0 }}>
                        View cert →
                      </Link>
                    )}
                  </div>
                  <div className="course-progress__label">{done}/{total} modules</div>
                  <div className="course-progress__bar">
                    <div className="course-progress__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <Link href={`/courses/${course.id}`} className="textlink" style={{ marginTop: '.8rem', fontSize: '.9rem' }}>
                    {done === 0 ? 'Start' : done === total ? 'Review' : 'Continue'}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
