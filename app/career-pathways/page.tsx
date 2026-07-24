'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import './career-pathways.css'

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'form' | 'results'
type PathwayKey = 'tech' | 'business' | 'media' | 'healthcare' | 'social' | 'entrepreneurship'

interface AssessmentData {
  name: string
  age: string
  currentJob: string
  careerGoal: string
  cvFileName: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ROADMAP_PHASES = [
  {
    badge: 'Phase 1', title: 'Foundation', duration: '0–6 months',
    items: [
      'Build core skills in your chosen field',
      'Complete relevant online courses',
      'Connect with professionals',
      'Build a portfolio of 2–3 projects',
    ],
  },
  {
    badge: 'Phase 2', title: 'Growth', duration: '6–12 months',
    items: [
      'Seek internship or junior role',
      'Deepen expertise through real projects',
      'Find a mentor in your field',
      'Build your professional network',
    ],
  },
  {
    badge: 'Phase 3', title: 'Advancement', duration: '1–2 years',
    items: [
      'Transition to mid-level role',
      'Develop leadership skills',
      'Explore international opportunities',
      'Mentor others in your field',
    ],
  },
]

const PATHWAYS = [
  { icon: '🖥️', title: 'Tech', roles: 'Software Engineer, Data Scientist, Product Manager, UX Designer', salary: '₦1.5M – ₦8M+/year' },
  { icon: '💼', title: 'Business', roles: 'Manager, Finance Analyst, Sales Lead, Strategist', salary: '₦1.2M – ₦6M+/year' },
  { icon: '📱', title: 'Media & Content', roles: 'Journalist, Content Creator, Video Producer, Marketer', salary: '₦600K – ₦3M+/year' },
  { icon: '🚀', title: 'Entrepreneurship', roles: 'Founder, Business Owner, Venture Builder', salary: 'Variable (₦0 – ∞)' },
  { icon: '🏥', title: 'Healthcare', roles: 'Healthcare Provider, Researcher, Healthcare Tech, Public Health', salary: '₦1.5M – ₦5M+/year' },
  { icon: '🤝', title: 'Social Impact', roles: 'NGO Leader, Policy Expert, Community Developer, CSR Manager', salary: '₦800K – ₦3M+/year' },
]

const OPPORTUNITIES = [
  { icon: '🔗', title: 'Remote Jobs', desc: 'Work for global companies from Nigeria. Remote roles often pay 2–3x more.' },
  { icon: '🎓', title: 'Scholarships', desc: 'Study abroad programs and fully-funded masters globally recognised.' },
  { icon: '✈️', title: 'Visa-Sponsored Roles', desc: 'Companies seeking Nigerian talent with visa sponsorship packages.' },
  { icon: '🚀', title: 'Build Your Profile', desc: 'Skills, portfolio, and network to compete for world-class opportunities.' },
]

const PATHWAY_SKILLS: Record<PathwayKey, string[]> = {
  tech: ['Programming', 'Data Analysis', 'System Design', 'Cloud Platforms', 'DevOps'],
  business: ['Financial Analysis', 'Strategic Planning', 'Sales', 'Negotiation', 'Excel/Analytics'],
  media: ['Content Writing', 'Video Editing', 'SEO/Marketing', 'Storytelling', 'Social Media'],
  healthcare: ['Clinical Skills', 'Research', 'Empathy', 'Attention to Detail', 'Medical Knowledge'],
  social: ['Systems Thinking', 'Advocacy', 'Program Management', 'Community Building', 'Policy'],
  entrepreneurship: ['Business Planning', 'Financial Mgmt', 'Sales', 'Leadership', 'Innovation'],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectPathway(careerGoal: string): PathwayKey {
  const g = careerGoal.toLowerCase()
  if (g.includes('entrepreneur') || g.includes('startup') || g.includes('founder') || g.includes('own business')) return 'entrepreneurship'
  if (g.includes('media') || g.includes('content') || g.includes('journal') || g.includes('creator') || g.includes('video') || g.includes('podcast') || g.includes('film')) return 'media'
  if (g.includes('health') || g.includes('medical') || g.includes('doctor') || g.includes('nurse') || g.includes('pharma') || g.includes('clinical')) return 'healthcare'
  if (g.includes('social') || g.includes('impact') || g.includes('ngo') || g.includes('policy') || g.includes('community') || g.includes('nonprofit')) return 'social'
  if (g.includes('finance') || g.includes('banking') || g.includes('accounting') || g.includes('invest') || g.includes('business') || g.includes('sales') || g.includes('manager')) return 'business'
  return 'tech'
}

function calculateTimeline(currentJob: string): string {
  const j = currentJob.toLowerCase()
  if (j.includes('student') || j.includes('fresh grad')) return '2–3'
  if (j.includes('intern') || j.includes('entry')) return '1–2'
  if (j.includes('junior') || j.includes('mid')) return '1–2'
  return '1.5–2.5'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CareerPathwaysPage() {
  const [phase, setPhase] = useState<Phase>('form')
  const [data, setData] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [cvFileName, setCvFileName] = useState('')
  const [cvError, setCvError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setCvFileName(''); setCvError('')
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setCvError('File too large. Maximum size is 5MB.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const valid = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!valid.includes(file.type)) {
      setCvError('Invalid file type. Please upload PDF or DOC/DOCX.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setCvFileName(file.name)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const assessment: AssessmentData = {
      name: (fd.get('name') as string).trim(),
      age: fd.get('age') as string,
      currentJob: (fd.get('currentJob') as string).trim(),
      careerGoal: (fd.get('careerGoal') as string).trim(),
      cvFileName,
    }
    try { localStorage.setItem('cp_assessment', JSON.stringify({ ...assessment, timestamp: new Date().toISOString() })) } catch {}
    setData(assessment)
    setPhase('results')
    setLoading(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleReset() {
    setPhase('form')
    setData(null)
    setCvFileName('')
    setCvError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────

  if (phase === 'results' && data) {
    const pathway = detectPathway(data.careerGoal)
    const timeline = calculateTimeline(data.currentJob)
    const skills = PATHWAY_SKILLS[pathway]

    return (
      <div className="cp-page">
        <section className="cp-hero">
          <div className="wrap cp-hero__inner">
            <span className="eyebrow" style={{ color: 'var(--green-800)', fontWeight: 700 }}>Your Results</span>
            <h1 className="display-lg mt-s">Your Personalised Career Roadmap</h1>
            <p className="lead mt-m">
              Based on your profile, <strong>{data.name}</strong>. Here&rsquo;s your tailored path forward.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="cp-results">

              {/* Welcome */}
              <div className="cp-welcome">
                <h2>Your Career Roadmap is Ready</h2>
                <p>
                  This assessment is designed for professionals, graduates, and undergraduates with existing skills
                  to navigate career transitions, advancement, and global opportunities.
                </p>
                <button className="btn btn--ghost" onClick={handleReset}>Take Assessment Again</button>
              </div>

              {/* Roadmap */}
              <div className="cp-section-box">
                <div className="cp-section-title">🗺️ Your 3-Phase Career Roadmap</div>
                <p className="cp-section-sub">
                  A clear path to reaching your goal. Expected timeline:{' '}
                  <strong style={{ color: 'var(--green-800)' }}>{timeline} years</strong>
                </p>
                {ROADMAP_PHASES.map(rp => (
                  <div key={rp.badge} className="cp-phase-card">
                    <div className="cp-phase-header">
                      <span className="cp-phase-badge">{rp.badge}</span>
                      <div>
                        <div className="cp-phase-title">{rp.title}</div>
                        <div className="cp-phase-duration">{rp.duration}</div>
                      </div>
                    </div>
                    <ul className="cp-phase-list">
                      {rp.items.map(item => (
                        <li key={item} className="cp-phase-item">
                          <span className="cp-check">✓</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Pathways */}
              <div className="cp-section-box">
                <div className="cp-section-title">💼 Discover 6 Career Pathways</div>
                <p className="cp-section-sub">Explore different career paths with realistic salary ranges in Nigeria and the skills needed.</p>
                <div className="cp-pathway-grid">
                  {PATHWAYS.map(p => (
                    <div key={p.title} className="cp-pathway-card">
                      <div className="cp-pathway-icon">{p.icon}</div>
                      <div className="cp-pathway-title">{p.title}</div>
                      <div className="cp-pathway-detail">
                        <span className="cp-pathway-label">Key Roles</span>
                        <div className="cp-pathway-value">{p.roles}</div>
                      </div>
                      <div className="cp-pathway-detail">
                        <span className="cp-pathway-label">Nigeria Salary Range</span>
                        <div className="cp-pathway-salary">{p.salary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div className="cp-section-box cp-section-box--tinted">
                <div className="cp-section-title">🌍 Global Opportunities Await</div>
                <p className="cp-section-sub">Access opportunities beyond borders while building your career in Nigeria.</p>
                <div className="cp-opp-grid">
                  {OPPORTUNITIES.map(o => (
                    <div key={o.title} className="cp-opp-card">
                      <div className="cp-opp-icon">{o.icon}</div>
                      <div className="cp-opp-title">{o.title}</div>
                      <p className="cp-opp-desc">{o.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="cp-section-box">
                <div className="cp-section-title">🎯 Skills You Need to Develop</div>
                <div className="cp-skills-container">
                  <div className="cp-skill-group">
                    <div className="cp-skill-group-title">🔴 Must-Have (Critical)</div>
                    <div className="cp-skill-badges">
                      {['Communication', 'Problem-solving', 'Adaptability', 'Time Management'].map(s => (
                        <span key={s} className="cp-skill-tag cp-skill-tag--critical">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="cp-skill-group">
                    <div className="cp-skill-group-title">💡 Path-Specific Skills</div>
                    <div className="cp-skill-badges">
                      {skills.map(s => (
                        <span key={s} className="cp-skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentorship CTA */}
              <div className="cp-mentorship">
                <h3>👥 Get Real Mentorship</h3>
                <p>Struggling to figure it out alone? Connect with professionals who&rsquo;ve been where you are and get personalised guidance.</p>
                <Link href="/volunteer" className="btn" style={{ background: 'white', color: 'var(--green-800)', fontWeight: 600 }}>
                  Find a Mentor
                </Link>
              </div>

              {/* Reset */}
              <div className="cp-reset">
                <button className="btn btn--ghost" onClick={handleReset}>Take Assessment Again</button>
              </div>

            </div>
          </div>
        </section>
      </div>
    )
  }

  // ── FORM ─────────────────────────────────────────────────────────────────

  return (
    <div className="cp-page">
      <section className="cp-hero">
        <div className="wrap cp-hero__inner">
          <span className="eyebrow" style={{ color: 'var(--green-800)', fontWeight: 700 }}>Career Assessment</span>
          <h1 className="display-lg mt-s">Discover Your Career Path</h1>
          <p className="lead mt-m">
            Take our quick assessment and get a personalised roadmap tailored to your interests, skills, and aspirations.
          </p>
          <p className="cp-audience-note">
            <strong>For:</strong> Professionals, Graduates, Undergraduates with skills &nbsp;|&nbsp;
            <strong> Not for:</strong> Secondary school students
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">

          {/* Eligibility box */}
          <div className="cp-eligibility">
            <h3 className="cp-eligibility__title">Who Should Take This Assessment?</h3>
            <p className="cp-eligibility__row">✓ <strong>Professionals</strong> looking to pivot, advance, or explore new fields</p>
            <p className="cp-eligibility__row">✓ <strong>Graduates</strong> ready to enter the job market or transition careers</p>
            <p className="cp-eligibility__row">✓ <strong>Undergraduates with skills</strong> preparing for your first professional role</p>
            <p className="cp-eligibility__row">
              ✗ <strong>Secondary school students:</strong> Check out our{' '}
              <Link href="/courses" style={{ color: 'var(--green-800)', textDecoration: 'none', fontWeight: 600 }}>
                courses
              </Link>{' '}
              designed for your level
            </p>
          </div>

          {/* Form card */}
          <div className="cp-form-card">
            <form onSubmit={handleSubmit}>

              <div className="cp-form-row">
                <div className="cp-field">
                  <label htmlFor="cp-name">Full Name *</label>
                  <input id="cp-name" name="name" type="text" placeholder="Your full name" required />
                </div>
                <div className="cp-field">
                  <label htmlFor="cp-age">Age *</label>
                  <input id="cp-age" name="age" type="number" min="16" max="80" placeholder="e.g., 22" required />
                </div>
              </div>

              <div className="cp-field">
                <label htmlFor="cp-job">What&rsquo;s Your Current Status? *</label>
                <input
                  id="cp-job"
                  name="currentJob"
                  type="text"
                  placeholder="e.g., Student, Software Engineer, Career Changer"
                  required
                />
              </div>

              {/* CV Upload */}
              <div>
                <label className="cp-upload-label">Upload Your CV (Optional)</label>
                <div className="cp-upload-box" onClick={() => fileRef.current?.click()}>
                  <div className="cp-upload-icon">📎</div>
                  <p>Click to upload your CV</p>
                  <small>PDF, DOC, or DOCX (Max 5MB)</small>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
                {cvFileName && <p className="cp-upload-feedback cp-upload-feedback--ok">✓ {cvFileName}</p>}
                {cvError && <p className="cp-upload-feedback cp-upload-feedback--err">❌ {cvError}</p>}
              </div>

              <div className="cp-field">
                <label htmlFor="cp-goal">What&rsquo;s Your Career Goal? *</label>
                <textarea
                  id="cp-goal"
                  name="careerGoal"
                  placeholder="Describe what you'd like to do. E.g., 'I want to become a product manager in a tech startup'"
                  required
                />
              </div>

              <button type="submit" className="cp-submit-btn" disabled={loading}>
                <span>{loading ? 'Analysing your profile…' : 'Get Your Personalised Roadmap'}</span>
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

            </form>
          </div>

        </div>
      </section>
    </div>
  )
}
