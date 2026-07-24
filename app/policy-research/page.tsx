import type { Metadata } from 'next'
import PolicyTimeline, { type PolicyPaper } from '@/components/PolicyTimeline'
import sql from '@/lib/db'

export const metadata: Metadata = {
  title: 'Policy & Research · Wissen-Haus',
  description: 'Comprehensive policy papers and research reports on youth employment, skills gap, and economic independence in Nigeria.',
}

async function getPapers(): Promise<PolicyPaper[]> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'policy_papers'`
    if (rows[0]?.value) return rows[0].value as PolicyPaper[]
  } catch {}
  return []
}

export default async function PolicyResearchPage() {
  const papers = await getPapers()

  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Policy &amp; Research</span>
            <h1 className="display-lg mt-s">Evidence for the future of work.</h1>
            <p className="lead mt-m">We publish comprehensive policy papers and research focused on youth economic independence, the skills gap, and the future of work in Nigeria.</p>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="grid grid-2 mb-l">
            <div className="paper-cover reveal">
              <div className="paper-cover__no">Policy Paper 001</div>
              <h3>Beyond Unemployment: A Skills-First Framework for Nigerian Youth Economic Independence</h3>
              <p className="paper-cover__sub">Nigeria&#39;s youth unemployment crisis is not merely an employment problem—it is a skills access problem. This paper proposes a three-pillar framework for systemic change.</p>
              <div className="paper-cover__meta">
                <strong>Authors:</strong> Wissen-Haus Research Team · <strong>Published:</strong> 2025
              </div>
              <div className="sdg-row">
                <span className="sdg">SDG 4 · Quality Education</span>
                <span className="sdg">SDG 8 · Decent Work</span>
                <span className="sdg">SDG 10 · Reduced Inequalities</span>
              </div>
              <div className="paper-cover__cta">
                <a href="/Wissen-Haus_Policy_Position_Paper_No_001.pdf" className="paper-dl" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '1.1em', height: '1.1em' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download PDF
                </a>
                <span className="paper-fmt">Free · 11 pages</span>
              </div>
            </div>

            <div className="reveal" data-d="1">
              <h3 className="h3 mb-m">Research Timeline</h3>
              <PolicyTimeline papers={papers.length ? papers : undefined} />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">Research Focus Areas</span>
            <h2>What we investigate.</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>Skills Gap Analysis</h3>
              <p>Mapping the gap between what schools teach and what employers need in modern Nigerian workplaces.</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg></div>
              <h3>Global Youth Labour Markets</h3>
              <p>How remote work and global hiring trends create both challenges and opportunities for African youth.</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
              <h3>Impact Measurement</h3>
              <p>Developing rigorous methodologies for measuring the real-world impact of career guidance interventions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Newsletter</span>
            <h2>Get our research in your inbox.</h2>
          </div>
          <form className="form" style={{ maxWidth: 480, margin: '0 auto' }} data-demo>
            <div className="form-row">
              <div className="field">
                <label htmlFor="pol-name">Name</label>
                <input id="pol-name" name="name" required placeholder="Your name" />
              </div>
              <div className="field">
                <label htmlFor="pol-email">Email</label>
                <input id="pol-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
            </div>
            <button type="submit" className="btn btn--block">Subscribe to Research Updates</button>
          </form>
        </div>
      </section>
    </>
  )
}
