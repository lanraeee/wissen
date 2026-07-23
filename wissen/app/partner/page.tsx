import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Partner With Us · Wissen-Haus',
  description: 'Partner with Wissen-Haus to empower Nigerian youth. For schools, companies, and individuals.',
}

export default function PartnerPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Partner With Us</span>
            <h1 className="display-lg mt-s">Let&#39;s build the bridge together.</h1>
            <p className="lead mt-m">Whether you&#39;re a school administrator, a company with a CSR mandate, or an individual with expertise to share — there&#39;s a partnership model for you.</p>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Partnership Models</span>
            <h2>Three ways to partner.</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>Schools &amp; Universities</h3>
              <p>Host Wissen-Haus events on campus. Give your students access to our community hub. Let us deliver Trade Fair skills sessions in your classrooms.</p>
              <a href="mailto:info@wissenhaus.org?subject=School Partnership Enquiry" className="textlink">Enquire now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg></div>
              <h3>Companies</h3>
              <p>Sponsor a Trade Fair cohort, offer internships through our platform, or send your employees as volunteer mentors. Meet your CSR goals while creating real impact.</p>
              <a href="mailto:info@wissenhaus.org?subject=Corporate Partnership Enquiry" className="textlink">Discuss a partnership
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg></div>
              <h3>Individuals</h3>
              <p>You&#39;re a professional who wants to give back but doesn&#39;t know how to structure it. We&#39;ll match you with students who need exactly what you offer.</p>
              <Link href="/volunteer" className="textlink">Become a mentor
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">How It Works</span>
            <h2>Simple to start. Built to last.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>Reach out</h4>
              <p>Drop us an email or fill out the form below. We&#39;ll respond within 3 business days.</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>Discovery call</h4>
              <p>A 30-minute conversation to understand your goals and how we can best collaborate.</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>Partnership proposal</h4>
              <p>We craft a tailored proposal with clear deliverables, timelines, and impact metrics.</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="step__n">04</div>
              <h4>Launch &amp; report</h4>
              <p>We deliver the programme and send you a detailed impact report afterwards.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Get in Touch</span>
            <h2>Start the conversation.</h2>
          </div>
          <form className="form" style={{ maxWidth: 640, margin: '0 auto' }} data-demo>
            <div className="form-row">
              <div className="field">
                <label htmlFor="p-name">Your Name</label>
                <input id="p-name" name="name" required placeholder="Ada Lovelace" />
              </div>
              <div className="field">
                <label htmlFor="p-org">Organisation</label>
                <input id="p-org" name="org" placeholder="Company / School name" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="p-email">Email</label>
              <input id="p-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="p-type">Partnership type</label>
              <select id="p-type" name="type" required>
                <option value="">Select…</option>
                <option>School / University</option>
                <option>Corporate / Company</option>
                <option>Individual Mentor</option>
                <option>NGO / Charity</option>
                <option>Media / Press</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-msg">Tell us about your goals</label>
              <textarea id="p-msg" name="message" required placeholder="What do you hope to achieve through this partnership?" />
            </div>
            <button type="submit" className="btn btn--block">Send Enquiry</button>
          </form>
        </div>
      </section>
    </>
  )
}
