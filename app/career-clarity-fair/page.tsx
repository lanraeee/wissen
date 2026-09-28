import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import { getPageCopy } from '@/lib/page-copy'
import { CAREER_CLARITY_FAIR_SCHEMA } from '@/lib/page-copy-schema'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('career-clarity-fair')!))
}

export default async function BootcampPage() {
  const c = await getPageCopy(CAREER_CLARITY_FAIR_SCHEMA)
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
                <Link href="/career-clarity-fair/register" className="btn btn--lg">{c.heroBtn1Text}</Link>
                <Link href="/volunteer" className="btn btn--ghost">{c.heroBtn2Text}</Link>
              </div>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/prog-bootcamp.jpg" alt="Students at the Wissen-Haus Career Clarity Fair" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* Donation drive — prominent, high-contrast callout so it can't be missed */}
      <section className="section section--tight" style={{ paddingBlock: 0, marginBottom: 'clamp(32px,5vw,56px)' }}>
        <div className="wrap">
          <Link
            href="/donate/series-1"
            className="reveal"
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 60%, var(--green-700) 100%)',
              border: '1px solid rgba(184,149,42,0.4)', borderRadius: 'var(--radius-lg)',
              padding: 'clamp(24px,4vw,36px) clamp(24px,5vw,44px)',
              boxShadow: '0 12px 40px rgba(15,45,29,0.25)',
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <span style={{
                display: 'inline-block', background: 'var(--red)', color: '#fff',
                fontFamily: 'var(--ff-mono)', fontSize: '.65rem', letterSpacing: '.14em',
                textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99, marginBottom: 14,
              }}>
                {c.donationBadge}
              </span>
              <h2 style={{ color: '#fff', marginBottom: 10, lineHeight: 1.1 }}>{c.donationTitle}</h2>
              <p style={{ color: 'rgba(244,240,231,.8)', lineHeight: 1.6, margin: 0 }}>
                {c.donationBody}
              </p>
            </div>
            <span className="btn btn--light btn--lg" style={{ flexShrink: 0 }}>
              {c.donationBtnText}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18, marginLeft: 8 }}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">{c.whoEyebrow}</span>
            <h2>{c.whoHeading}</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>{c.who1Title}</h3>
              <p>{c.who1Body}</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg></div>
              <h3>{c.who2Title}</h3>
              <p>{c.who2Body}</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg></div>
              <h3>{c.who3Title}</h3>
              <p>{c.who3Body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">{c.howEyebrow}</span>
            <h2>{c.howHeading}</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>{c.step1Title}</h4>
              <p>{c.step1Body}</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>{c.step2Title}</h4>
              <p>{c.step2Body}</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>{c.step3Title}</h4>
              <p>{c.step3Body}</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="step__n">04</div>
              <h4>{c.step4Title}</h4>
              <p>{c.step4Body}</p>
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
              <Link href="/career-clarity-fair/register" className="btn btn--light btn--lg">{c.ctaBtn1Text}</Link>
              <Link href="/partner" className="btn btn--outline-light btn--lg">{c.ctaBtn2Text}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
