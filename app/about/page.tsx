import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { pageMetadata } from '@/lib/seo'
import { getPageCopy } from '@/lib/page-copy'
import { ABOUT_SCHEMA } from '@/lib/page-copy-schema'

export const metadata: Metadata = pageMetadata({
  title: 'About Us · Wissen-Haus',
  ogTitle: 'About Us',
  description: 'The Wissen-Haus journey: bridging the classroom and the world so every young African and diaspora changemaker can achieve economic independence.',
})

export default async function AboutPage() {
  const c = await getPageCopy(ABOUT_SCHEMA)
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">{c.heroEyebrow}</span>
            <h1 className="display-lg mt-s">{c.heroTitle}</h1>
            <p className="lead mt-m">{c.heroLead}</p>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <article className="card reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="card__media">
              <Image src="/img/about-hero.jpg" alt="Wissen-Haus story" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="card__body">
              <h3>{c.storyTitle}</h3>
              <p>{c.storyBody}</p>
              <Link href="/about/story" className="textlink" style={{ marginTop: 16 }}>
                {c.storyLinkText}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>{c.ctaTitle}</h2>
            <p className="lead">{c.ctaLead}</p>
            <div className="cta-actions">
              <Link href="/volunteer" className="btn btn--light btn--lg">{c.ctaVolunteerText}</Link>
              <Link href="/partner" className="btn btn--outline-light btn--lg">{c.ctaPartnerText}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
