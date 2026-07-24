import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import VolunteerForm from '@/components/VolunteerForm'

export const metadata: Metadata = {
  title: 'Volunteer · Wissen-Haus',
  description: 'Volunteer with Wissen-Haus and help bridge the skills gap in Ibadan and beyond. Mentor, train and support Nigerian youth.',
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function VolunteerPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Volunteer With Us</span>
              <h1 className="display-lg mt-s">Join the mission to empower Nigeria&#39;s youth.</h1>
              <p className="lead mt-m">Help us bridge the skills gap in Ibadan and beyond by contributing your time and expertise to mentor the next generation of leaders.</p>
              <div className="hero-cta mt-m">
                <a href="#apply" className="btn btn--lg">Start mentoring {ARROW}</a>
              </div>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/volunteer.jpg" alt="Wissen-Haus volunteers mentoring Nigerian students" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Ways to Contribute</span>
            <h2>Ways to Contribute Your Skills</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>
              </div>
              <h3>Mentoring</h3>
              <p>Guide students through career choices and personal growth by sharing your professional journey and advice.</p>
              <span className="tag-line">Build Impact · Gain Community</span>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 5l-3 14" /></svg>
              </div>
              <h3>Technical Training</h3>
              <p>Help bridge the skills gap by teaching coding, digital marketing, or vocational skills to our eager participants.</p>
              <span className="tag-line">Share Skills · Empower Youth</span>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" /></svg>
              </div>
              <h3>Operations</h3>
              <p>Contribute your time to content creation, event planning, or logistical support as we scale our impact across Nigeria.</p>
              <span className="tag-line">Shape the Future · Gain Experience</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap center">
          <span className="quote-mark reveal">&ldquo;</span>
          <p className="quote-lg reveal" style={{ color: '#fff', maxWidth: '26ch', marginInline: 'auto' }}>Volunteering with Wissen-Haus gave me back as much as I gave — real relationships, real growth.</p>
          <div className="mt-m reveal" data-d="1">
            <div className="testi__name" style={{ color: 'var(--gold)' }}>Tolu Adeyemi</div>
            <div className="testi__role">Mentor, 2025 cohort</div>
          </div>
        </div>
      </section>

      <section className="section" id="apply">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Apply</span>
            <h2>Ready to give your time?</h2>
            <p className="lead">Fill out the form below and our team will reach out within 5 business days.</p>
          </div>
          <VolunteerForm />
        </div>
      </section>
    </>
  )
}
