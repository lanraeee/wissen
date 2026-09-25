import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'DataCamp Donates Partnership Â· Wissen-Haus',
  description: 'Wissen-Haus is now a DataCamp Donates partner. 500 DataCamp licenses available for students and team members.',
}

export default function DataCampPartnerPage() {
  return (
    <>
      {/* Hero */}
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <span className="eyebrow eyebrow--light">New Partnership</span>
            <h1 className="display-lg mt-s" style={{ color: '#fff' }}>
              Free DataCamp Access for Our Community
            </h1>
            <p className="lead mt-m" style={{ color: 'rgba(244,240,231,.78)' }}>
              Starting October 5, 2026, Wissen-Haus students and team members get free access to DataCamp&apos;s world-class data science and AI courses.
            </p>
            <div className="cta-actions mt-l">
              <a href="mailto:info@wissenhaus.org?subject=DataCamp Access Request" className="btn btn--light btn--lg">Request Access</a>
              <a href="https://www.datacamp.com" className="btn btn--outline-light btn--lg" target="_blank" rel="noopener noreferrer">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* Partnership Details */}
      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">What You Get</span>
            <h2>500 Premium Licenses</h2>
          </div>

          <div className="grid grid-2">
            <div className="feature reveal">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2 3h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3>Unlimited Courses</h3>
              <p>Access to DataCamp&apos;s entire library including Python, R, SQL, Machine Learning, and AI courses designed by industry experts.</p>
            </div>

            <div className="feature reveal" data-d="1">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M11 9h2v5h-2zM11 17h2v2h-2z" />
                </svg>
              </div>
              <h3>Real-World Projects</h3>
              <p>Learn by doing with hands-on projects that build your portfolio and practical data skills employers value.</p>
            </div>

            <div className="feature reveal" data-d="2">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 10v6m0 0a8 8 0 0 1-15.996.186m15.996-.186a8 8 0 0 0-15.996-.186m15.996.186A8.001 8.001 0 0 0 6.004 16m0 0a8 8 0 0 1-1.996-5.5m1.996 5.5a8 8 0 0 0 15.996.186" />
                </svg>
              </div>
              <h3>Career Growth</h3>
              <p>Earn certificates and build your data science profile to stand out to employers globally.</p>
            </div>

            <div className="feature reveal" data-d="3">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </div>
              <h3>Interactive Learning</h3>
              <p>Learn at your own pace with interactive coding exercises and immediate feedback from the platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section panel-muted">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Getting Started</span>
            <h2>Three simple steps.</h2>
          </div>

          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>Check Eligibility</h4>
              <p>You&#39;re eligible if you&#39;re a Wissen-Haus student, team member, or scholarship recipient.</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>Request Access</h4>
              <p>Email info@wissenhaus.org with your full name and email. We&#39;ll review and send your DataCamp invite.</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>Start Learning</h4>
              <p>Accept the invite, create your DataCamp account, and choose from 500+ courses to advance your skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why DataCamp */}
      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Why DataCamp?</span>
            <h2>The leading platform for data skills.</h2>
            <p className="lead mt-m">
              DataCamp is trusted by millions of learners and thousands of companies worldwide. It&#39;s the fastest way to learn data science, AI, and analytics skills.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }} className="reveal">
              <h4 style={{ fontSize: '1rem', marginBottom: '.5rem' }}>Expert Instructors</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6 }}>
                Learn from industry experts and experienced data professionals who teach what they practice.
              </p>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }} className="reveal" data-d="1">
              <h4 style={{ fontSize: '1rem', marginBottom: '.5rem' }}>Hands-On Learning</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6 }}>
                Code in the browser with instant feedback. No setup requiredâ€”start learning immediately.
              </p>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }} className="reveal" data-d="2">
              <h4 style={{ fontSize: '1rem', marginBottom: '.5rem' }}>Career Ready</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6 }}>
                Build a portfolio of projects and earn certificates that employers recognize and value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About DataCamp Donates */}
      <section className="section panel-dark">
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <span className="eyebrow eyebrow--light">DataCamp Donates</span>
            <h2 style={{ color: '#fff' }}>Supporting Nonprofits &amp; Social Impact</h2>
            <p className="lead mt-m" style={{ color: 'rgba(244,240,231,.78)', maxWidth: '60ch', margin: 'var(--spacing-m) auto 0' }}>
              DataCamp Donates is a program that provides free premium licenses to nonprofits and social-impact organizations like Wissen-Haus. We&#39;re proud to be part of this global effort to democratize data education.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Ready to Level Up Your Data Skills?</h2>
            <p className="lead">
              Get free access to DataCamp and start learning data science, AI, and analytics from industry experts.
            </p>
            <div className="cta-actions">
              <a href="mailto:info@wissenhaus.org?subject=DataCamp Access Request" className="btn btn--light btn--lg">Request Access Now</a>
              <Link href="/partner" className="btn btn--outline-light btn--lg">Explore Other Partnerships</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
