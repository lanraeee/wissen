import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import DonateWidget from '@/components/DonateWidget'

export const metadata: Metadata = {
  title: 'Donate · Wissen-Haus',
  description: 'Fuel a young Nigerian\'s future. Your gift funds free career Trade Fairs, mentorship and global exposure for students who need it most.',
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function DonatePage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Donate</span>
              <h1 className="display-lg mt-s">Fuel a young Nigerian&#39;s future.</h1>
              <p className="lead mt-m">Every gift helps us deliver free career Trade Fairs, mentorship and global exposure to students who need it most. Bridge the skills gap with us.</p>
              <div className="hero-cta mt-m">
                <a href="#give" className="btn btn--lg">Give now {ARROW}</a>
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
            <span className="eyebrow">Your Impact</span>
            <h2>Every naira builds a career-ready future.</h2>
            <p className="lead">Since our launch in 2025, gifts from people like you have reached young Nigerians across Ibadan and beyond.</p>
          </div>
          <div className="stats reveal" data-d="1">
            <div className="stat"><div className="num" data-count="500" data-suffix="+">500+</div><div className="lbl">Students Reached</div></div>
            <div className="stat"><div className="num" data-count="30" data-suffix="+">30+</div><div className="lbl">Mentors Involved</div></div>
            <div className="stat"><div className="num" data-count="15" data-suffix="+">15+</div><div className="lbl">School Partnerships</div></div>
            <div className="stat"><div className="num" data-count="1" data-suffix="">1</div><div className="lbl">Year Since Launch</div></div>
          </div>
        </div>
      </section>

      <section className="section" id="give">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Give Now</span>
            <h2>Choose a gift that changes a life.</h2>
            <p className="lead">Pick a suggested amount or enter your own. Nigerian donors pay via Paystack; international donors via Stripe. Every contribution goes directly to equipping students.</p>
          </div>
          <div className="card reveal" style={{ padding: 'clamp(24px,4vw,48px)', maxWidth: 640, margin: '0 auto' }}>
            <DonateWidget />
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }} className="reveal">
            <p style={{ color: 'var(--ink-60)', marginBottom: '.75rem', fontSize: '.9rem' }}>Prefer a direct bank transfer?</p>
            <a href="mailto:info@wissenhaus.org?subject=Donation Enquiry" className="textlink">
              Contact us for bank details {ARROW}
            </a>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">Transparency</span>
            <h2>Your money, clearly accounted for.</h2>
            <p className="lead">We publish annual reports and provide detailed impact statements to all donors above ₦20,000.</p>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              <h3>70% Programmes</h3>
              <p>Directly funds workshops, Trade Fairs, and student resources.</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg></div>
              <h3>20% Operations</h3>
              <p>Staff time, technology, and administration that makes delivery possible.</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg></div>
              <h3>10% Growth</h3>
              <p>Reserved to expand to new schools and communities across Nigeria.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
