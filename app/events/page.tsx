import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { getPageCopy } from '@/lib/page-copy'
import { EVENTS_SCHEMA } from '@/lib/page-copy-schema'

export const metadata: Metadata = pageMetadata({
  title: 'Events & Cafés · Wissen-Haus',
  ogTitle: 'Events & Cafés',
  description: 'Networking events, career cafés, and workshops that connect African youth and the diaspora with professionals in relaxed, inspiring settings.',
})

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const EVENT_ICONS = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4l3 3" />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
  </svg>,
]

export default async function EventsPage() {
  const c = await getPageCopy(EVENTS_SCHEMA)
  const eventTypes = [
    { title: c.type1Title, desc: c.type1Body },
    { title: c.type2Title, desc: c.type2Body },
    { title: c.type3Title, desc: c.type3Body },
    { title: c.type4Title, desc: c.type4Body },
  ]
  return (
    <>
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)', textAlign: 'center' }}>
        <div className="wrap">
          <span className="eyebrow eyebrow--light reveal">{c.heroEyebrow}</span>
          <h1 className="display-lg mt-s reveal" style={{ color: '#fff' }}>{c.heroTitle}</h1>
          <p className="lead mt-m reveal" data-d="1" style={{ color: 'rgba(244,240,231,.78)', maxWidth: 620, marginInline: 'auto' }}>
            {c.heroLead}
          </p>
          <div className="cta-actions mt-l reveal" data-d="2">
            <a href="#upcoming" className="btn btn--light btn--lg">{c.heroBtn1Text}</a>
            <Link href="/community" className="btn btn--outline-light btn--lg">{c.heroBtn2Text}</Link>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.formatsEyebrow}</span>
            <h2>{c.formatsHeading}</h2>
          </div>
          <div className="grid grid-2">
            {eventTypes.map((e, i) => (
              <div key={e.title} className="feature reveal" data-d={i % 2 === 1 ? '1' : undefined}>
                <div className="feature__ic">{EVENT_ICONS[i]}</div>
                <h3>{e.title}</h3>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight panel-muted" id="upcoming">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.upcomingEyebrow}</span>
            <h2>{c.upcomingHeading}</h2>
            <p className="lead mt-m">{c.upcomingLead}</p>
          </div>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <form className="form" data-demo>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="ev-name">Name</label>
                  <input id="ev-name" name="name" required placeholder="Your name" />
                </div>
                <div className="field">
                  <label htmlFor="ev-email">Email</label>
                  <input id="ev-email" name="email" type="email" required placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" className="btn btn--block">{c.upcomingBtnText}</button>
            </form>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="grid grid-2">
            <div className="cta-band reveal" style={{ marginBottom: 0 }}>
              <h2>{c.hostTitle}</h2>
              <p className="lead">{c.hostBody}</p>
              <div className="cta-actions">
                <Link href="/partner" className="btn btn--light btn--lg">{c.hostBtnText}</Link>
              </div>
            </div>
            <div className="cta-band reveal" data-d="1" style={{ marginBottom: 0, background: 'var(--green-50)', border: '1px solid var(--line)' }}>
              <h2 style={{ color: 'var(--ink)' }}>{c.speakerTitle}</h2>
              <p className="lead" style={{ color: 'var(--muted)' }}>{c.speakerBody}</p>
              <div className="cta-actions">
                <Link href="/contact" className="btn btn--lg">{c.speakerBtnText} {ARROW}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
