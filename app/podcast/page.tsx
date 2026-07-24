import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Opportunity Blueprint Podcast · Wissen-Haus',
  description: 'Our flagship podcast featuring weekly career insights and guidance from professionals who\'ve walked the path.',
}

export default function PodcastPage() {
  return (
    <>
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)', textAlign: 'center' }}>
        <div className="wrap">
          <span className="eyebrow eyebrow--light reveal">Programmes · Podcast</span>
          <h1 className="display-lg mt-s reveal" style={{ color: '#fff' }}>Opportunity Blueprint</h1>
          <p className="lead mt-m reveal" data-d="1" style={{ color: 'rgba(244,240,231,.78)', maxWidth: 60, marginInline: 'auto' }}>
            Weekly career insights, real stories, and practical guidance from professionals building careers across Africa and beyond. Launching soon.
          </p>
          <div className="cta-actions mt-l reveal" data-d="2">
            <a href="#notify" className="btn btn--light btn--lg">Notify me when it launches</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">What to Expect</span>
            <h2>Real conversations that open doors.</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" /></svg></div>
              <h3>Career Stories</h3>
              <p>Hear how professionals went from school to their dream careers — including the failures, setbacks, and breakthroughs.</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg></div>
              <h3>Global Perspective</h3>
              <p>From Lagos to London, insights on how to position yourself for global opportunities while remaining grounded in Nigeria.</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>Practical Takeaways</h3>
              <p>Every episode ends with concrete steps you can take this week to move your career forward.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight" id="notify">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Stay Updated</span>
            <h2>Be the first to know when we launch.</h2>
          </div>
          <form className="form" style={{ maxWidth: 480, margin: '0 auto' }} data-demo>
            <div className="form-row">
              <div className="field">
                <label htmlFor="pod-name">Name</label>
                <input id="pod-name" name="name" required placeholder="Your name" />
              </div>
              <div className="field">
                <label htmlFor="pod-email">Email</label>
                <input id="pod-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
            </div>
            <button type="submit" className="btn btn--block">Notify me</button>
          </form>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Want to be a guest?</h2>
            <p className="lead">Share your career story on Opportunity Blueprint. We&#39;re especially interested in professionals working in Nigeria, across Africa, or in the diaspora.</p>
            <div className="cta-actions">
              <Link href="/contact" className="btn btn--light btn--lg">Get in touch</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
