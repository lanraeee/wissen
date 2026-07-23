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
    </>
  )
}
