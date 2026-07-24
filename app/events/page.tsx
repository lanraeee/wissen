import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Events & Cafés · Wissen-Haus',
  description: 'Networking events, career cafés, and workshops that connect Nigerian youth with professionals in relaxed, inspiring settings.',
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const EVENT_TYPES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Career Cafés',
    desc: 'Informal coffee-style sessions where students sit with professionals in a specific field and ask anything — no formality, just real conversation.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Workshops',
    desc: 'Hands-on skill-building sessions covering CV writing, interview preparation, personal branding, and navigating the modern job market.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Networking Events',
    desc: 'Curated evenings that bridge the gap between students, recent graduates, and working professionals in a structured yet relaxed setting.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
      </svg>
    ),
    title: 'Panel Talks',
    desc: 'Industry-specific panels where experts share career paths, industry insights, and honest advice you won\'t find in a classroom.',
  },
]

export default function EventsPage() {
  return (
    <>
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)', textAlign: 'center' }}>
        <div className="wrap">
          <span className="eyebrow eyebrow--light reveal">Programmes · Events</span>
          <h1 className="display-lg mt-s reveal" style={{ color: '#fff' }}>Events &amp; Cafés</h1>
          <p className="lead mt-m reveal" data-d="1" style={{ color: 'rgba(244,240,231,.78)', maxWidth: 620, marginInline: 'auto' }}>
            Networking events, career cafés, and workshops that connect Nigerian youth with professionals — in real spaces, with real conversations.
          </p>
          <div className="cta-actions mt-l reveal" data-d="2">
            <a href="#upcoming" className="btn btn--light btn--lg">See upcoming events</a>
            <Link href="/community" className="btn btn--outline-light btn--lg">Join the community</Link>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">What We Run</span>
            <h2>Four formats, one goal: connection.</h2>
          </div>
          <div className="grid grid-2">
            {EVENT_TYPES.map((e, i) => (
              <div key={e.title} className="feature reveal" data-d={i % 2 === 1 ? '1' : undefined}>
                <div className="feature__ic">{e.icon}</div>
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
            <span className="eyebrow">Upcoming Events</span>
            <h2>Mark your calendar.</h2>
            <p className="lead mt-m">Our next events are being confirmed. Join the community to be the first to hear about dates, venues, and how to register.</p>
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
              <button type="submit" className="btn btn--block">Notify me of upcoming events</button>
            </form>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="grid grid-2">
            <div className="cta-band reveal" style={{ marginBottom: 0 }}>
              <h2>Host an event with us.</h2>
              <p className="lead">Have a venue, a network, or an idea? Partner with Wissen-Haus to bring career events to your school, community, or organisation.</p>
              <div className="cta-actions">
                <Link href="/partner" className="btn btn--light btn--lg">Partner with us</Link>
              </div>
            </div>
            <div className="cta-band reveal" data-d="1" style={{ marginBottom: 0, background: 'var(--green-50)', border: '1px solid var(--line)' }}>
              <h2 style={{ color: 'var(--ink)' }}>Be a speaker.</h2>
              <p className="lead" style={{ color: 'var(--muted)' }}>Share your career story at a Wissen-Haus event. We especially welcome professionals from diverse fields, backgrounds, and career paths.</p>
              <div className="cta-actions">
                <Link href="/contact" className="btn btn--lg">Get in touch {ARROW}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
