import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import { getPageCopy } from '@/lib/page-copy'
import { PROGRAMMES_SCHEMA } from '@/lib/page-copy-schema'

export const metadata: Metadata = pageMetadata({
  title: 'Programmes · Wissen-Haus',
  ogTitle: 'Our Programmes',
  description: 'Career Clarity Fair, Opportunity Blueprint Podcast, Impact Content, Events, and Career Hub — all our programmes in one place.',
})

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default async function ProgrammesPage() {
  const c = await getPageCopy(PROGRAMMES_SCHEMA)
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
          <div className="grid grid-3">
            <article className="card reveal">
              <div className="card__media">
                <span className="card__tag">In-Person</span>
                <Image src="/img/prog-bootcamp.jpg" alt="Career Clarity Fair" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">01</span>
                <h3>{c.p1Title}</h3>
                <p>{c.p1Body}</p>
                <Link href="/career-clarity-fair" className="textlink">{c.p1LinkText} {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal" data-d="1">
              <div className="card__media">
                <span className="card__tag">Podcast</span>
                <Image src="/img/prog-podcast.jpg" alt="Opportunity Blueprint Podcast" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">02</span>
                <h3>{c.p2Title}</h3>
                <p>{c.p2Body}</p>
                <Link href="/opportunity-blueprint" className="textlink">{c.p2LinkText} {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal" data-d="2">
              <div className="card__media">
                <span className="card__tag">Digital</span>
                <Image src="/img/prog-impact.jpg" alt="Impact Content" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">03</span>
                <h3>{c.p3Title}</h3>
                <p>{c.p3Body}</p>
                <Link href="/impact-content" className="textlink">{c.p3LinkText} {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal">
              <div className="card__body">
                <span className="card__num">04</span>
                <h3>{c.p4Title}</h3>
                <p>{c.p4Body}</p>
                <Link href="/events" className="textlink">{c.p4LinkText} {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal" data-d="1">
              <div className="card__body">
                <span className="card__num">05</span>
                <h3>{c.p5Title}</h3>
                <p>{c.p5Body}</p>
                <Link href="/community" className="textlink">{c.p5LinkText} {ARROW}</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>{c.ctaTitle}</h2>
            <p className="lead">{c.ctaLead}</p>
            <div className="cta-actions">
              <Link href="/partner" className="btn btn--light btn--lg">{c.ctaPartnerText}</Link>
              <Link href="/contact" className="btn btn--outline-light btn--lg">{c.ctaContactText}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
