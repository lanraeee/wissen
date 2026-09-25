import type { Metadata } from 'next'
import Link from 'next/link'
import { COURSES } from '@/lib/courseData'

export const metadata: Metadata = {
  title: 'Courses · Wissen-Haus',
  description: 'Free and premium certificate courses for Nigerian youth. Build real career skills.',
}

export default function CoursesPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Learning Library</span>
            <h1 className="display-lg">Build skills. Earn certificates. Change your future.</h1>
            <p className="lead">Practical career education designed for Nigerian and African youth. Learn at your own pace, earn shareable certificates.</p>
          </div>
          <div className="grid grid-3">
            {COURSES.map((course, i) => (
              <article key={course.id} className="card reveal" data-d={i % 3 as unknown as string}>
                <div className="card__body">
                  {course.isPremium ? (
                    <span className="card__num" style={{ color: 'var(--red)' }}>PREMIUM · {course.modules.length} MODULES</span>
                  ) : (
                    <span className="badge-free">FREE · {course.modules.length} MODULES</span>
                  )}
                  <h3 style={{ marginTop: '.6rem' }}>{course.title}</h3>
                  <p>{course.tagline}</p>
                  <Link href={`/courses/${course.id}`} className="textlink" style={{ marginTop: 'auto', paddingTop: '.6rem' }}>
                    {course.isPremium ? 'View course' : 'Start for free'}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DataCamp Partnership Banner */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #0F2D1D 100%)' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }} className="reveal">
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '.5rem' }}>Complement Your Learning</h3>
              <p style={{ color: 'rgba(244,240,231,.78)', marginBottom: '1rem' }}>
                Through our partnership with DataCamp, get free access to 500+ premium data science and AI courses. Perfect for advancing your technical skills.
              </p>
              <Link href="/partners/datacamp" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '.95rem' }}>
                Learn about DataCamp <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 16, height: 16 }}><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div style={{ minWidth: '120px', opacity: 0.9 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/partners/datacamp-logo-inverted.png" alt="DataCamp Donates" style={{ height: 48, objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
