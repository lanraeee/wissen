import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import ContactForm from '@/components/ContactForm'
import { getPageCopy } from '@/lib/page-copy'
import { CONTACT_SCHEMA } from '@/lib/page-copy-schema'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('contact')!))
}

export default async function ContactPage() {
  const c = await getPageCopy(CONTACT_SCHEMA)
  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap">
        <div className="section-head center mb-l reveal">
          <h1 className="display-lg">{c.heroTitle}</h1>
          <p className="lead">{c.heroLead}</p>
        </div>

        <div className="grid grid-2 mb-l">
          <div className="feature reveal">
            <div className="info-list">
              <div className="info-item">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <div className="k">{c.generalLabel}</div>
                  <a href="mailto:info@wissenhaus.org" className="v">info@wissenhaus.org</a>
                </div>
              </div>
              <div className="info-item">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <div className="k">{c.partnershipsLabel}</div>
                  <a href="mailto:director@wissenhaus.org" className="v">director@wissenhaus.org</a>
                </div>
              </div>
              <div className="info-item">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div className="k">{c.hqLabel}</div>
                  <span className="v">{c.hqValue}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div className="k">{c.intlLabel}</div>
                  <span className="v">{c.intlValue}</span>
                </div>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>

        <div className="card reveal" style={{ padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
          <h3>{c.followTitle}</h3>
          <p style={{ color: 'var(--ink-60)', margin: '0.75rem 0 1.2rem' }}>{c.followBody}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://www.instagram.com/wissen_haus" target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">Instagram</a>
            <a href="https://www.linkedin.com/company/wissen-haus-empowerment-foundation" target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">LinkedIn</a>
          </div>
        </div>
      </div>
    </section>
  )
}
