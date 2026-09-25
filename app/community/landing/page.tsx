import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Community Hub · Wissen-Haus',
  description: 'Join the Wissen-Haus community hub to access scholarships, internships, jobs, courses, and mentorship.',
}

export default function CommunityLandingPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Community Hub</span>
              <h1 className="display-lg mt-s">Where Nigerian Youth Grow, Together.</h1>
              <p className="lead mt-m">Access scholarships, internships, jobs, free courses, mentorship and a thriving community—everything a young changemaker needs in one place.</p>
              <div style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link href="/login" className="btn">Join Now</Link>
                <Link href="/login?mode=login" className="btn btn--ghost">Sign In</Link>
              </div>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/community.jpg" alt="Wissen-Haus community members collaborating" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-m reveal">
            <h2>What You&#39;ll Access as a Member</h2>
          </div>
          <div className="grid grid-3">
            <article className="card reveal">
              <div className="card__body">
                <span className="tl-tag">Opportunities</span>
                <h3>Scholarships &amp; Jobs</h3>
                <p>Curated opportunities from top organizations across Africa. Updated daily from multiple sources.</p>
              </div>
            </article>
            <article className="card reveal" data-d="1">
              <div className="card__body">
                <span className="tl-tag">Learning</span>
                <h3>Free Courses</h3>
                <p>Certificate courses in soft skills, digital literacy, AI, entrepreneurship, and leadership.</p>
              </div>
            </article>
            <article className="card reveal" data-d="2">
              <div className="card__body">
                <span className="tl-tag">Community</span>
                <h3>Member Network</h3>
                <p>Connect with peers, share wins, ask questions, and access mentorship from experienced professionals.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ color: '#fff', marginBottom: 24 }}>Join 1000+ Nigerian Youth</h2>
            <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 32, lineHeight: 1.7 }}>
              Get instant access to scholarships, internships, jobs, free courses, and a supportive community of changemakers.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" className="btn btn--light">Create Free Account</Link>
              <Link href="/login?mode=login" className="btn btn--outline-light">Already a Member?</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
