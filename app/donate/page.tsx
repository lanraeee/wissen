import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import DonateWidget from '@/components/DonateWidget'
import { getPageCopy } from '@/lib/page-copy'
import { DONATE_SCHEMA } from '@/lib/page-copy-schema'
import { getSiteContent } from '@/lib/site-content'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import { getDonationSettings } from '@/lib/donation-settings'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('donate')!))
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface StatItem { count: string; suffix: string; label: string }
// Same site_content key the homepage's stats row reads (site_settings ->
// homepage_stats), so this page's numbers can never drift out of sync with it.
const DEFAULT_STATS: StatItem[] = [
  { count: '500', suffix: '+', label: 'Students Reached' },
  { count: '30', suffix: '+', label: 'Mentors Involved' },
  { count: '15', suffix: '+', label: 'School Partnerships' },
  { count: '1', suffix: '', label: 'Year Since Launch' },
]

export default async function DonatePage() {
  const [c, statsContent, donationSettings] = await Promise.all([
    getPageCopy(DONATE_SCHEMA),
    getSiteContent<StatItem[]>('homepage_stats'),
    getDonationSettings(),
  ])
  const stats = Array.isArray(statsContent) && statsContent.length === 4 ? statsContent : DEFAULT_STATS

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
                <a href="#give" className="btn btn--lg">{c.heroBtnText} {ARROW}</a>
              </div>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/community-2.jpg" alt="Wissen-Haus community members and students in Ibadan" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section section--tight">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">{c.impactEyebrow}</span>
            <h2>{c.impactHeading}</h2>
            <p className="lead">{c.impactLead}</p>
          </div>
          <div className="stats reveal" data-d="1">
            {stats.map(s => (
              <div className="stat" key={s.label}>
                <div className="num" data-count={s.count} data-suffix={s.suffix}>{s.count}{s.suffix}</div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="give">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.giveEyebrow}</span>
            <h2>{c.giveHeading}</h2>
            <p className="lead">{c.giveLead}</p>
          </div>
          <div className="card reveal" style={{ padding: 'clamp(24px,4vw,48px)', maxWidth: 640, margin: '0 auto' }}>
            <DonateWidget zeffyEnabled={donationSettings.zeffy_enabled} zeffyFormUrl={donationSettings.zeffy_general_form_url} />
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }} className="reveal">
            <p style={{ color: 'var(--ink-60)', fontSize: '.9rem', maxWidth: '48ch', margin: '0 auto' }}>
              {c.bankTransferNote}
            </p>
          </div>
        </div>
      </section>

      {/* DataCamp Partnership Banner */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #0F2D1D 100%)' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }} className="reveal">
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '.5rem' }}>{c.dcTitle}</h3>
              <p style={{ color: 'rgba(244,240,231,.78)', marginBottom: '1rem' }}>
                {c.dcBody}
              </p>
              <Link href="/partners/datacamp" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '.95rem' }}>
                {c.dcLinkText} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 16, height: 16 }}><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div style={{ minWidth: '120px', opacity: 0.9 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/partners/datacamp-logo-inverted.png" alt="DataCamp Donates" style={{ height: 48, objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">{c.transparencyEyebrow}</span>
            <h2>{c.transparencyHeading}</h2>
            <p className="lead">{c.transparencyLead}</p>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              <h3>{c.split1Title}</h3>
              <p>{c.split1Body}</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg></div>
              <h3>{c.split2Title}</h3>
              <p>{c.split2Body}</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg></div>
              <h3>{c.split3Title}</h3>
              <p>{c.split3Body}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
