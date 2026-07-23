import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Our Story · Wissen-Haus',
  description: 'The Wissen-Haus journey: bridging the classroom and the world so every young Nigerian can achieve economic independence.',
}

export default function AboutStoryPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Our Story</span>
              <h1 className="display-lg mt-s">Building the bridge young Nigerians deserve.</h1>
              <p className="lead mt-m">We started small—mentoring and counselling young people one by one, seeing firsthand how transformative real guidance can be. What we discovered is that this problem is bigger than one person can solve. So we&#39;re building Wissen-Haus to scale what we&#39;ve learned and help thousands of talented young Nigerians access the opportunities that should be available to everyone.</p>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/about-hero.jpg" alt="Wissen-Haus students and mentors" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="section-index">01 · The Problem We Saw</span>
              <h2 className="mt-s">What Sparked Our Mission</h2>
            </div>
            <div className="reveal" data-d="1">
              <p className="lead">Imagine graduating with excellent grades, only to discover that employers want something your school never taught you. Imagine having a brilliant idea for a business but not knowing a single person in the industry. Imagine being talented but invisible because you grew up outside the circles where opportunities flow.</p>
              <p className="lead mt-m">This is the reality for millions of young Nigerians. Not because they lack talent. Not because they don&#39;t work hard. But because the bridge between what they learn and what the world needs simply doesn&#39;t exist.</p>
              <p className="lead mt-m" style={{ fontWeight: 600, color: 'var(--green-800)' }}>We saw this gap. And we decided to build a bridge.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="section-index">02 · What We&#39;re Building</span>
              <h2 className="mt-s">Three Pillars of Change</h2>
            </div>
            <div className="reveal" data-d="1">
              <p className="lead">We&#39;ve learned from mentoring 50+ young people that real transformation happens through three things:</p>
              <p className="lead mt-m"><strong style={{ color: '#fff' }}>Trade Fair</strong> — Intensive, practical training in the skills employers actually need. Not textbooks. Real tools for landing jobs and building careers.</p>
              <p className="lead mt-m"><strong style={{ color: '#fff' }}>Opportunity Blueprint Podcast</strong> — Direct access to the stories of people who&#39;ve built what you dream about. Proof that it&#39;s possible. Inspiration that sticks.</p>
              <p className="lead mt-m"><strong style={{ color: '#fff' }}>Community &amp; Mentorship</strong> — A network where you&#39;re not alone. Real mentors. Real peers. Real accountability. This is where lasting change happens.</p>
              <p className="lead mt-m">We&#39;re just getting started. Every person we mentor teaches us how to build this better. Every success story shows us we&#39;re on the right path.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Our Approach</span>
            <h2>Three things set us apart—and why they matter.</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l2.2 5.5L20 9l-4.4 3.6L17 18l-5-3-5 3 1.4-5.4L4 9l5.8-.5z" /></svg>
              </div>
              <h3>Skills That Get Jobs</h3>
              <p>Not theory. We teach what employers actually hire for—communication, problem-solving, leadership—because classroom skills alone won&#39;t cut it.</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>
              </div>
              <h3>Mentors Who Care</h3>
              <p>Not advisors. Real working professionals who&#39;ve been where you are, who&#39;ll call you back, and who&#39;ll help you navigate the bumpy road to your first job or business.</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>
              </div>
              <h3>A Growing Community</h3>
              <p>You&#39;re not alone. Connect with peers, mentors, and changemakers who are building careers, starting businesses, and lifting each other up.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Be part of the story.</h2>
            <p className="lead">Whether you mentor, partner or give, you help a young Nigerian bridge the gap between potential and opportunity.</p>
            <div className="cta-actions">
              <Link href="/volunteer" className="btn btn--light btn--lg">Volunteer with us</Link>
              <Link href="/founder" className="btn btn--outline-light btn--lg">Meet the Founder</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
