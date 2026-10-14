import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { pageMetadata } from '@/lib/seo'
import { getPageCopy } from '@/lib/page-copy'
import { ABOUT_SCHEMA } from '@/lib/page-copy-schema'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import { CHARITABLE_OBJECTS } from '@/lib/charitable-objects'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('about')!))
}

// The four questions every programme answers before it starts. Written as
// commitments about how we work, so each one must be true of current programmes.
const HOW_WE_CHOOSE = [
  { question: 'Who is it for?', answer: 'A named group of youth, not a general audience.' },
  { question: 'What lasts after the cohort leaves?', answer: 'Skills, materials and networks that keep working without us.' },
  { question: 'Who runs it?', answer: 'A named lead, accountable for it after launch.' },
  { question: 'What do we learn?', answer: 'Each programme feeds what we change next time.' },
]

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

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Our Charitable Objects</span>
            <h2>What the charity exists to do.</h2>
            <p className="lead mt-s">
              These are the charitable purposes in the charity&#39;s constitution, which is being finalised for registration with the Charity Commission. Our programmes, partnerships and publications are designed to serve them.
            </p>
          </div>
          <div className="grid grid-2">
            {CHARITABLE_OBJECTS.map((o, i) => (
              <article className="feature reveal" key={o.title}>
                <span className="card__num">0{i + 1}</span>
                <p><strong>{o.title}</strong>{o.rest}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">How We Choose Our Work</span>
            <h2>Lasting help, not one-off help.</h2>
            <p className="lead mt-s">
              One-off help meets this month&#39;s need. A skill a youth keeps, or a network that keeps meeting after the course ends, meets next year&#39;s. Every programme we run answers four questions before it starts.
            </p>
          </div>
          <div className="grid grid-2">
            {HOW_WE_CHOOSE.map((q, i) => (
              <article className="feature reveal" key={q.question}>
                <span className="card__num">0{i + 1}</span>
                <h3>{q.question}</h3>
                <p>{q.answer}</p>
              </article>
            ))}
          </div>
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
