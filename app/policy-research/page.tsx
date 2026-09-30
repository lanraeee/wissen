import type { Metadata } from 'next'
import Image from 'next/image'
import { pageMetadata } from '@/lib/seo'
import PolicyTimeline, { type PolicyPaper } from '@/components/PolicyTimeline'
import sql from '@/lib/db'
import { getPageCopy } from '@/lib/page-copy'
import { POLICY_RESEARCH_SCHEMA } from '@/lib/page-copy-schema'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('policy-research')!))
}

async function getPapers(): Promise<PolicyPaper[]> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'policy_papers'`
    if (rows[0]?.value) return rows[0].value as PolicyPaper[]
  } catch {}
  return []
}

export default async function PolicyResearchPage() {
  const [papers, c] = await Promise.all([getPapers(), getPageCopy(POLICY_RESEARCH_SCHEMA)])

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
              <Image src="/img/policy.jpg" alt="Wissen-Haus policy and research work" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="grid grid-2 mb-l">
            <div className="paper-cover reveal">
              <div className="paper-cover__no">{c.paperNumber}</div>
              <h3>{c.paperTitle}</h3>
              <p className="paper-cover__sub">{c.paperSub}</p>
              <div className="paper-cover__meta">
                <strong>Authors:</strong> {c.paperAuthors} · <strong>Published:</strong> {c.paperYear}
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
                <span className="paper-fmt">{c.paperFormat}</span>
              </div>
            </div>

            <div className="reveal" data-d="1">
              <h3 className="h3 mb-m">{c.timelineTitle}</h3>
              <PolicyTimeline papers={papers.length ? papers : undefined} />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">{c.focusEyebrow}</span>
            <h2>{c.focusHeading}</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>{c.focus1Title}</h3>
              <p>{c.focus1Body}</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg></div>
              <h3>{c.focus2Title}</h3>
              <p>{c.focus2Body}</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
              <h3>{c.focus3Title}</h3>
              <p>{c.focus3Body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.newsletterEyebrow}</span>
            <h2>{c.newsletterHeading}</h2>
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
            <button type="submit" className="btn btn--block">{c.newsletterBtnText}</button>
          </form>
        </div>
      </section>
    </>
  )
}
