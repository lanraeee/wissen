import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import OpportunityGrid from '@/components/OpportunityGrid'
import StreakBadge from '@/components/StreakBadge'

export const metadata: Metadata = {
  title: 'Community Hub · Wissen-Haus',
  description: 'Scholarships, internships, mentorship, courses and a community feed—everything a young Nigerian changemaker needs in one place.',
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function CommunityPage() {
  return (
    <>
      <StreakBadge />

      {/* HERO */}
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Community Hub</span>
              <h1 className="display-lg mt-s">Where Nigerian youth grow, together.</h1>
              <p className="lead mt-m">Scholarships, internships, mentorship, courses and a community feed—everything a young changemaker needs, in one place.</p>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/community.jpg" alt="Wissen-Haus community members collaborating" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* NAV PILLS */}
      <section className="section section--tight" style={{ padding: 'clamp(24px,3vw,40px) 0' }}>
        <div className="wrap">
          <div className="pillrow mb-l">
            <Link className="p p--active" href="#opportunities">Opportunity Hub</Link>
            <Link className="p" href="#learning">Learning Library</Link>
            <Link className="p" href="/community/threads">Discussion Threads</Link>
          </div>
        </div>
      </section>

      {/* OPPORTUNITY HUB */}
      <section className="section" id="opportunities">
        <div className="wrap">
          <div className="section-head mb-m reveal">
            <span className="eyebrow">Opportunity Hub</span>
            <h2>Scholarships, internships, jobs &amp; grants, curated for Nigerian youth.</h2>
          </div>
          <div className="pillrow mb-l reveal" data-d="1">
            <Link className="p" href="/scholarships">Scholarships</Link>
            <Link className="p" href="/jobs">Jobs</Link>
            <Link className="p" href="/internships">Internships</Link>
            <Link className="p" href="/competitions">Competitions</Link>
          </div>
          <OpportunityGrid showFilter={true} />
        </div>
      </section>

      {/* LEARNING LIBRARY */}
      <section className="section panel-dark" id="learning">
        <div className="wrap">
          <div className="section-head mb-m reveal">
            <span className="eyebrow eyebrow--light">Learning Library</span>
            <h2>Free courses, guides &amp; toolkits to build career-ready skills.</h2>
          </div>
          <div className="pillrow mb-l reveal" data-d="1">
            <Link className="p p--active" href="/courses">Browse All Courses</Link>
          </div>
          <div className="grid grid-3">
            <article className="card reveal">
              <div className="card__body">
                <span className="card__num" style={{ color: 'var(--green-800)' }}>CERTIFICATE COURSE</span>
                <h3>Career Launch Blueprint</h3>
                <p>Everything you need to know before graduating. CV writing, interviewing, networking, and your 5-year plan.</p>
                <Link href="/courses/career-launch" className="textlink">Start the course {ARROW}</Link>
              </div>
            </article>
            <article className="card reveal" data-d="1">
              <div className="card__body">
                <span className="card__num" style={{ color: 'var(--green-800)' }}>FREE COURSE</span>
                <h3>Soft Skills for the Modern Workplace</h3>
                <p>Communication, teamwork, problem solving, and professional presentation — the skills every employer wants.</p>
                <Link href="/courses/soft-skills" className="textlink">Start for free {ARROW}</Link>
              </div>
            </article>
            <article className="card reveal" data-d="2">
              <div className="card__body">
                <span className="card__num" style={{ color: 'var(--green-800)' }}>CERTIFICATE COURSE</span>
                <h3>AI for Everyone</h3>
                <p>Learn to use AI tools to enhance your work, productivity and career prospects — no coding required.</p>
                <Link href="/courses/ai" className="textlink">Start the course {ARROW}</Link>
              </div>
            </article>
          </div>
          <div className="hero-cta mt-l reveal">
            <Link href="/courses" className="btn btn--light">View all courses</Link>
          </div>
        </div>
      </section>

      {/* YOUR JOURNEY STEPS */}
      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Your Journey</span>
            <h2>Four steps to economic independence.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>Discover your path</h4>
              <p>Use our career assessment to find work that fits your personality, values and skills.</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>Build your skills</h4>
              <p>Take free certificate courses. Download guides. Practise with real templates.</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>Grab opportunities</h4>
              <p>Apply to scholarships, internships, remote jobs, and competitions you actually qualify for.</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="step__n">04</div>
              <h4>Give back</h4>
              <p>Share your wins, mentor others, and keep the cycle of empowerment going.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Ready to take your career seriously?</h2>
            <p className="lead">Use the career assessment to find your direction, then build your plan from there.</p>
            <div className="cta-actions">
              <Link href="/career-assessment" className="btn btn--light btn--lg">Take the Assessment</Link>
              <Link href="/courses" className="btn btn--outline-light btn--lg">Browse Courses</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
