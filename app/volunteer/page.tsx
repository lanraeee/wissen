import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Image from 'next/image'
import VolunteerForm from '@/components/VolunteerForm'
import { getPageCopy } from '@/lib/page-copy'
import { VOLUNTEER_SCHEMA } from '@/lib/page-copy-schema'

export const metadata: Metadata = pageMetadata({
  title: 'Volunteer · Wissen-Haus',
  ogTitle: 'Volunteer With Us',
  description: 'Volunteer with Wissen-Haus and help bridge the skills gap in Ibadan and beyond. Mentor, train and support African youth and the diaspora.',
})

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default async function VolunteerPage() {
  const c = await getPageCopy(VOLUNTEER_SCHEMA)
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">{c.heroEyebrow}</span>
              <h1 className="display-lg mt-s">{c.heroTitle}</h1>
              <p className="lead mt-m">{c.heroLead}</p>
              <div className="hero-cta mt-m">
                <a href="#apply" className="btn btn--lg">{c.heroBtnText} {ARROW}</a>
              </div>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/volunteer.jpg" alt="Wissen-Haus volunteers mentoring Nigerian students" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">{c.waysEyebrow}</span>
            <h2>{c.waysHeading}</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>
              </div>
              <h3>{c.way1Title}</h3>
              <p>{c.way1Body}</p>
              <span className="tag-line">{c.way1Tag}</span>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 5l-3 14" /></svg>
              </div>
              <h3>{c.way2Title}</h3>
              <p>{c.way2Body}</p>
              <span className="tag-line">{c.way2Tag}</span>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" /></svg>
              </div>
              <h3>{c.way3Title}</h3>
              <p>{c.way3Body}</p>
              <span className="tag-line">{c.way3Tag}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap center">
          <span className="quote-mark reveal">&ldquo;</span>
          <p className="quote-lg reveal" style={{ color: '#fff', maxWidth: '26ch', marginInline: 'auto' }}>{c.quote}</p>
          <div className="mt-m reveal" data-d="1">
            <div className="testi__name" style={{ color: 'var(--gold)' }}>{c.quoteName}</div>
            <div className="testi__role">{c.quoteRole}</div>
          </div>
        </div>
      </section>

      <section className="section" id="apply">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.applyEyebrow}</span>
            <h2>{c.applyHeading}</h2>
            <p className="lead">{c.applyLead}</p>
          </div>
          <VolunteerForm />
        </div>
      </section>
    </>
  )
}
