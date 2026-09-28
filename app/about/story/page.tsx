import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import { getPageCopy } from '@/lib/page-copy'
import { ABOUT_STORY_SCHEMA } from '@/lib/page-copy-schema'

export const metadata: Metadata = pageMetadata({
  title: 'Our Story · Wissen-Haus',
  ogTitle: 'Our Story',
  description: 'The Wissen-Haus journey: bridging the classroom and the world so every young African and diaspora changemaker can achieve economic independence.',
})

export default async function AboutStoryPage() {
  const c = await getPageCopy(ABOUT_STORY_SCHEMA)
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">{c.heroEyebrow}</span>
              <h1 className="display-lg mt-s">{c.heroTitle}</h1>
              <p className="lead mt-m">{c.heroLead}</p>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/about-hero.jpg" alt="Wissen-Haus students and mentors" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="section-index">{c.s1Index}</span>
              <h2 className="mt-s">{c.s1Heading}</h2>
            </div>
            <div className="reveal" data-d="1">
              <p className="lead">{c.s1Para1}</p>
              <p className="lead mt-m">{c.s1Para2}</p>
              <p className="lead mt-m" style={{ fontWeight: 600, color: 'var(--green-800)' }}>{c.s1Para3}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="section-index">{c.s2Index}</span>
              <h2 className="mt-s">{c.s2Heading}</h2>
            </div>
            <div className="reveal" data-d="1">
              <p className="lead">{c.s2Intro}</p>
              <p className="lead mt-m"><strong style={{ color: '#fff' }}>{c.pillar1Label}</strong> — {c.pillar1Body}</p>
              <p className="lead mt-m"><strong style={{ color: '#fff' }}>{c.pillar2Label}</strong> — {c.pillar2Body}</p>
              <p className="lead mt-m"><strong style={{ color: '#fff' }}>{c.pillar3Label}</strong> — {c.pillar3Body}</p>
              <p className="lead mt-m">{c.s2Closing}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">{c.approachEyebrow}</span>
            <h2>{c.approachHeading}</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l2.2 5.5L20 9l-4.4 3.6L17 18l-5-3-5 3 1.4-5.4L4 9l5.8-.5z" /></svg>
              </div>
              <h3>{c.feature1Title}</h3>
              <p>{c.feature1Body}</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>
              </div>
              <h3>{c.feature2Title}</h3>
              <p>{c.feature2Body}</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>
              </div>
              <h3>{c.feature3Title}</h3>
              <p>{c.feature3Body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>{c.ctaTitle}</h2>
            <p className="lead">{c.ctaLead}</p>
            <div className="cta-actions">
              <Link href="/volunteer" className="btn btn--light btn--lg">{c.ctaVolunteerText}</Link>
              <Link href="/founder" className="btn btn--outline-light btn--lg">{c.ctaFounderText}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
