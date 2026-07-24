import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Careers · Wissen-Haus',
  description: 'Join the Wissen-Haus team and help bridge the skills gap for Nigerian youth.',
}

const ROLES = [
  { title: 'Programme Coordinator', type: 'Freelance & Volunteer · Part-time · Ibadan', desc: 'Help deliver our Trade Fair and community events. Background in education or youth work preferred.' },
  { title: 'Content Writer', type: 'Freelance & Volunteer · Remote', desc: 'Create impact stories, blog posts, and educational content that resonates with Nigerian youth.' },
  { title: 'Social Media Manager', type: 'Freelance & Volunteer · Remote · Part-time', desc: 'Grow our Instagram and LinkedIn presence. You know the algorithm and you understand our audience.' },
  { title: 'Partnerships Lead', type: 'Freelance & Volunteer · Hybrid · Lagos or Ibadan', desc: 'Build relationships with schools, companies, and NGOs who want to reach and empower Nigerian youth.' },
  { title: 'Course Curriculum Developer', type: 'Freelance & Volunteer · Remote · Project-based', desc: 'Design practical, engaging course content for our online learning library.' },
  { title: 'Data & Impact Analyst', type: 'Freelance & Volunteer · Remote · Part-time', desc: 'Help us measure what works. Build dashboards, analyse survey data, and write impact reports.' },
]

const INTERNSHIPS = [
  { title: 'Communications Intern', type: '3 months · Remote', desc: 'Support our content team with writing, editing, and managing our newsletter and social posts.' },
  { title: 'Research Intern', type: '3-6 months · Remote', desc: 'Assist the policy team with desk research, literature reviews, and survey analysis.' },
  { title: 'Technology Intern', type: '3 months · Remote', desc: 'Help maintain and improve our web platform. Next.js, TypeScript, and Postgres experience helpful.' },
]

export default function CareersPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Careers at Wissen-Haus</span>
            <h1 className="display-lg mt-s">Build what you wish existed.</h1>
            <p className="lead mt-m">We&#39;re a small, mission-driven team building the resources Nigerian youth deserve. If that resonates, we&#39;d love to work with you.</p>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="head-row mb-l reveal">
            <div className="section-head">
              <span className="eyebrow">Freelance &amp; Volunteer Roles</span>
              <h2>Current openings</h2>
            </div>
          </div>
          <div className="grid grid-2 mb-l">
            {ROLES.map((role, i) => (
              <div key={role.title} className="card reveal" data-d={i % 2 as unknown as string}>
                <div className="card__body">
                  <span className="card__num">{role.type}</span>
                  <h3 style={{ marginTop: '.4rem' }}>{role.title}</h3>
                  <p>{role.desc}</p>
                  <a href={`mailto:info@wissenhaus.org?subject=Application: ${role.title}`} className="textlink" style={{ marginTop: 'auto', paddingTop: '.6rem' }}>
                    Apply now
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="head-row mb-l reveal">
            <div className="section-head">
              <span className="eyebrow">Internships</span>
              <h2>For students &amp; recent graduates</h2>
            </div>
          </div>
          <div className="grid grid-3">
            {INTERNSHIPS.map((role, i) => (
              <div key={role.title} className="card reveal" data-d={i % 3 as unknown as string}>
                <div className="card__body">
                  <span className="card__num">{role.type}</span>
                  <h3 style={{ marginTop: '.4rem' }}>{role.title}</h3>
                  <p>{role.desc}</p>
                  <a href={`mailto:info@wissenhaus.org?subject=Internship Application: ${role.title}`} className="textlink" style={{ marginTop: 'auto', paddingTop: '.6rem' }}>
                    Apply
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Don&#39;t see your role?</h2>
            <p className="lead">We&#39;re always on the lookout for passionate people. Send us your CV and a note about how you&#39;d contribute.</p>
            <div className="cta-actions">
              <a href="mailto:info@wissenhaus.org?subject=Speculative Application" className="btn btn--light btn--lg">Send a speculative application</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
