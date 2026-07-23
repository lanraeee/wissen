'use client'

import { useState } from 'react'
import Link from 'next/link'

const QUESTIONS = [
  {
    q: 'What energises you most?',
    opts: ['Solving complex problems', 'Creating and designing things', 'Helping and supporting people', 'Leading and managing teams', 'Analysing data and patterns'],
    type: ['tech', 'creative', 'people', 'business', 'data']
  },
  {
    q: 'Which school subject did you enjoy most?',
    opts: ['Maths & Further Maths', 'Art, Music or Drama', 'Biology or Health Science', 'Commerce or Economics', 'Literature or Languages'],
    type: ['tech', 'creative', 'people', 'business', 'comms']
  },
  {
    q: 'How do you prefer to work?',
    opts: ['Independently on deep tasks', 'Collaboratively in a creative team', 'Face-to-face with people', 'In meetings, planning and strategy', 'Alone, analysing and researching'],
    type: ['tech', 'creative', 'people', 'business', 'data']
  },
  {
    q: 'What matters most to you in work?',
    opts: ['Building things that scale', 'Making something beautiful', 'Changing someone\'s life', 'Growing revenue and business', 'Understanding how things work'],
    type: ['tech', 'creative', 'people', 'business', 'data']
  },
  {
    q: 'Which of these sounds most like you?',
    opts: ['I love coding or building apps', 'I have a strong aesthetic eye', 'People come to me for advice', 'I\'m natural at sales and negotiation', 'I love research and reports'],
    type: ['tech', 'creative', 'people', 'business', 'data']
  },
]

const RESULTS: Record<string, { title: string; desc: string; paths: string[]; link: string }> = {
  tech: { title: 'Technology & Engineering', desc: 'You thrive on building systems and solving complex problems. Careers in software engineering, product management, DevOps, and cybersecurity could be a great fit.', paths: ['Software Engineer', 'Product Manager', 'Data Engineer', 'Cybersecurity Analyst'], link: '/community' },
  creative: { title: 'Creative & Design', desc: 'You have a strong visual and creative sense. Careers in graphic design, UI/UX, content creation, film, fashion, and architecture align with your strengths.', paths: ['UI/UX Designer', 'Graphic Designer', 'Content Creator', 'Architect', 'Film Director'], link: '/community' },
  people: { title: 'People & Social Impact', desc: 'You\'re driven by helping others thrive. Careers in counselling, medicine, teaching, social work, HR, and NGO leadership would be fulfilling.', paths: ['Doctor / Nurse', 'Counsellor / Therapist', 'HR Manager', 'Non-Profit Leader', 'Teacher'], link: '/community' },
  business: { title: 'Business & Entrepreneurship', desc: 'You\'re a natural strategist and builder. Careers in business development, finance, consulting, marketing, and entrepreneurship suit your drive.', paths: ['Entrepreneur', 'Business Analyst', 'Marketing Manager', 'Finance Analyst', 'Consultant'], link: '/courses/career-launch' },
  data: { title: 'Research & Analysis', desc: 'You love understanding how things work deeply. Careers in data science, research, economics, journalism, and policy would leverage your analytical mind.', paths: ['Data Scientist', 'Economist', 'Researcher', 'Journalist', 'Policy Analyst'], link: '/policy-research' },
  comms: { title: 'Communications & Media', desc: 'You have a gift for language and connection. Careers in PR, writing, broadcasting, law, and diplomacy could be ideal.', paths: ['Journalist', 'PR Manager', 'Lawyer', 'Author', 'Broadcaster'], link: '/community' },
}

export default function CareerAssessmentPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<string | null>(null)

  function handleAnswer(type: string) {
    const newAnswers = [...answers, type]
    setAnswers(newAnswers)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      // tally
      const counts: Record<string, number> = {}
      newAnswers.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
      setResult(top)
    }
  }

  function reset() {
    setStep(0); setAnswers([]); setResult(null)
  }

  const res = result ? RESULTS[result] : null
  const progress = ((step) / QUESTIONS.length) * 100

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)', minHeight: '80vh' }}>
      <div className="wrap" style={{ maxWidth: 680 }}>
        {!result ? (
          <>
            <div className="section-head center mb-l">
              <span className="eyebrow">Career Assessment</span>
              <h1 className="display-lg mt-s">Find your direction.</h1>
              <p className="lead">5 quick questions to help you discover career paths that match who you are.</p>
            </div>

            <div className="assessment-progress" style={{ height: 6, background: 'var(--line)', borderRadius: 'var(--pill)', overflow: 'hidden', marginBottom: '2rem' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--red), var(--gold))', transition: 'width .4s' }} />
            </div>

            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '.78rem', color: 'var(--ink-60)', marginBottom: '1rem', letterSpacing: '.1em' }}>
              {step + 1} / {QUESTIONS.length}
            </div>

            <h2 style={{ marginBottom: '1.5rem' }}>{QUESTIONS[step].q}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {QUESTIONS[step].opts.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(QUESTIONS[step].type[i])}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '14px 20px', borderRadius: 'var(--radius)', border: '1.5px solid var(--line)', background: 'var(--paper)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .25s, background .25s', fontFamily: 'var(--ff-body)', fontSize: '1rem', color: 'var(--ink)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-800)'; (e.currentTarget as HTMLElement).style.background = 'var(--green-50)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper)' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : res ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
            <span className="eyebrow">Your Result</span>
            <h2 className="mt-s" style={{ marginBottom: '1rem' }}>{res.title}</h2>
            <p className="lead" style={{ marginBottom: '2rem' }}>{res.desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {res.paths.map(p => (
                <span key={p} className="badge-free">{p}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={res.link} className="btn btn--lg">Explore Resources</Link>
              <button onClick={reset} className="btn btn--ghost">Retake Assessment</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
