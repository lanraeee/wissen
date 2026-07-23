import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About Us · Wissen-Haus',
  description: 'The Wissen-Haus journey: bridging the classroom and the world so every young Nigerian can achieve economic independence.',
}

export default function AboutPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">About Wissen-Haus</span>
            <h1 className="display-lg mt-s">Bridging the skills gap in Nigeria.</h1>
            <p className="lead mt-m">Explore our story, meet our founder, discover impact stories from our community, and get in touch with us.</p>
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
              <h3>Our Story</h3>
              <p>Discover the Wissen-Haus journey, our mission, and the values that drive everything we do. Learn how we&#39;re bridging the gap between the classroom and the world.</p>
              <Link href="/about/story" className="textlink" style={{ marginTop: 16 }}>
                Read our story
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Be part of the story.</h2>
            <p className="lead">Whether you mentor, partner or give, you help a young Nigerian bridge the gap between potential and opportunity.</p>
            <div className="cta-actions">
              <Link href="/volunteer" className="btn btn--light btn--lg">Volunteer with us</Link>
              <Link href="/partner" className="btn btn--outline-light btn--lg">Partner with us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
