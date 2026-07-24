import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Programmes · Wissen-Haus',
  description: 'Trade Fair, Opportunity Blueprint Podcast, Impact Content, Events, and Career Hub — all our programmes in one place.',
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ProgrammesPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Our Programmes</span>
            <h1 className="display-lg mt-s">Everything we build, built for you.</h1>
            <p className="lead mt-m">From one-day career fairs to podcasts to digital courses—every Wissen-Haus programme is designed to bridge a real gap in a young Nigerian&#39;s journey.</p>
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
                <Image src="/img/prog-bootcamp.jpg" alt="Career Clarity Trade Fair" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">01</span>
                <h3>Career Clarity Trade Fair</h3>
                <p>A one-day career exploration fair for secondary school students in Ibadan. Meet professionals, explore diverse careers, and discover your path forward.</p>
                <Link href="/career-clarity-trade-fair" className="textlink">Learn more {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal" data-d="1">
              <div className="card__media">
                <span className="card__tag">Podcast</span>
                <Image src="/img/prog-podcast.jpg" alt="Opportunity Blueprint Podcast" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">02</span>
                <h3>Opportunity Blueprint</h3>
                <p>Our flagship podcast featuring weekly career insights and guidance from professionals who&#39;ve walked the path. Launching soon.</p>
                <Link href="/opportunity-blueprint" className="textlink">Find out more {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal" data-d="2">
              <div className="card__media">
                <span className="card__tag">Digital</span>
                <Image src="/img/prog-impact.jpg" alt="Impact Content" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">03</span>
                <h3>Impact Content</h3>
                <p>Social-impact storytelling that highlights Nigerian youth doing extraordinary things. Your story matters and deserves to be told.</p>
                <Link href="/impact-content" className="textlink">Explore stories {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal">
              <div className="card__body">
                <span className="card__num">04</span>
                <h3>Events &amp; Cafés</h3>
                <p>Regular networking events, career cafés, and workshops that connect students with professionals in relaxed settings.</p>
                <Link href="/events" className="textlink">See events {ARROW}</Link>
              </div>
            </article>

            <article className="card reveal" data-d="1">
              <div className="card__body">
                <span className="card__num">05</span>
                <h3>Career Hub</h3>
                <p>Online platform with job boards, scholarship listings, free courses, mentorship matching, and career tools—all in one place.</p>
                <Link href="/community" className="textlink">Access the hub {ARROW}</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Partner with a programme.</h2>
            <p className="lead">Bring Wissen-Haus to your school, sponsor a cohort, or host a career fair. Let&#39;s talk about what&#39;s possible.</p>
            <div className="cta-actions">
              <Link href="/partner" className="btn btn--light btn--lg">Partner with us</Link>
              <Link href="/contact" className="btn btn--outline-light btn--lg">Get in touch</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
