import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

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
              <Image src="/img/hero-students.jpg" alt="Nigerian secondary school students in a Wissen-Haus career Trade Fair" fill style={{ objectFit: 'cover' }} />
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
            <span className="eyebrow">Ways to Give</span>
            <h2>Choose a gift that changes a life.</h2>
            <p className="lead">Pick a suggested amount, or give whatever you can. Every contribution goes directly to equipping students with practical, job-ready skills.</p>
          </div>
          <div className="grid grid-3">
            <article className="plan reveal">
              <div className="plan__price">₦5,000 <small>/ or your chosen amount</small></div>
              <h3>The Spark</h3>
              <p className="plan__desc">Gives a student access to one Wissen-Haus Career Discovery workshop — a single session that often changes everything.</p>
              <ul className="plan__list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  Career Discovery workshop seat
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  Workbook &amp; resources
                </li>
              </ul>
              <a href="https://paystack.com/pay/wissenhaus-5k" target="_blank" rel="noopener noreferrer" className="btn">Donate ₦5,000</a>
            </article>

            <article className="plan plan--feat reveal" data-d="1">
              <div className="plan__flag">Most Popular</div>
              <div className="plan__price">₦20,000 <small>/ or your chosen amount</small></div>
              <h3>The Builder</h3>
              <p className="plan__desc">Sponsors a student&#39;s full Trade Fair experience — skills assessment, coaching session, and certificate.</p>
              <ul className="plan__list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  Full Trade Fair participation
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  1-on-1 coaching session
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  Certificate of participation
                </li>
              </ul>
              <a href="https://paystack.com/pay/wissenhaus-20k" target="_blank" rel="noopener noreferrer" className="btn btn--light">Donate ₦20,000</a>
            </article>

            <article className="plan reveal" data-d="2">
              <div className="plan__price">₦50,000 <small>/ or your chosen amount</small></div>
              <h3>The Champion</h3>
              <p className="plan__desc">Sponsors an entire school cohort&#39;s Trade Fair access and funds Wissen-Haus community hub for a month.</p>
              <ul className="plan__list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  School cohort Trade Fair access
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  Community hub operating costs (1 month)
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                  Named impact report
                </li>
              </ul>
              <a href="https://paystack.com/pay/wissenhaus-50k" target="_blank" rel="noopener noreferrer" className="btn">Donate ₦50,000</a>
            </article>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }} className="reveal">
            <p className="lead" style={{ marginBottom: '1rem' }}>Prefer to transfer directly or donate from abroad?</p>
            <a href="mailto:info@wissenhaus.org?subject=Donation Enquiry" className="textlink">
              Contact us for bank transfer details {ARROW}
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
