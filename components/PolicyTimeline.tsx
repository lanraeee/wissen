'use client'

import { useState } from 'react'

const papers = [
  {
    date: 'Mar 2025',
    tag: 'Published',
    no: '001',
    theme: 'Youth Employability',
    title: 'Beyond Unemployment',
    subtitle: 'A Skills-First Framework for Nigerian Youth Economic Independence',
    status: 'completed',
  },
  {
    date: 'May 2025',
    tag: 'Upcoming',
    no: '002',
    theme: 'Artificial Intelligence',
    title: "AI Won't Steal Nigeria's Future",
    subtitle: 'Poor Preparation Will',
    status: 'upcoming',
  },
  {
    date: 'Jul 2025',
    tag: 'Upcoming',
    no: '003',
    theme: 'Career Development',
    title: 'Degrees Without Direction',
    subtitle: 'Rethinking the Path from Education to Employment',
    status: 'upcoming',
  },
  {
    date: 'Sep 2025',
    tag: 'Upcoming',
    no: '004',
    theme: 'Digital Skills',
    title: 'Skills for Tomorrow',
    subtitle: 'Building a Digitally-Ready Nigerian Workforce',
    status: 'upcoming',
  },
]

export default function PolicyTimeline() {
  const [active, setActive] = useState<number | null>(0)

  return (
    <div className="timeline">
      {papers.map((p, i) => {
        const isOpen = active === i
        return (
          <div
            key={i}
            className="tl-item"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setActive(isOpen ? null : i)}
          >
            <div className="tl-date">{p.date}</div>
            <div className="tl-body">
              <span className="tl-tag" style={p.status === 'completed' ? { color: 'var(--green-600)', borderColor: 'var(--green-600)' } : undefined}>
                {p.tag}
              </span>
              <h3 style={{ marginBottom: '.25rem' }}>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '.5em' }}>
                  {p.no}
                </span>
                {p.title}
              </h3>
              <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: isOpen ? '.75rem' : 0, lineHeight: 1.5 }}>
                {p.theme}
              </p>
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: isOpen ? '120px' : '0',
                  opacity: isOpen ? 1 : 0,
                  transition: 'max-height .3s ease, opacity .25s ease',
                }}
              >
                <p style={{ fontSize: '.9rem', paddingTop: '.25rem', borderTop: '1px solid var(--line)', paddingBottom: '.5rem' }}>
                  {p.subtitle}
                </p>
              </div>
            </div>
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'none' }} />
          </div>
        )
      })}
    </div>
  )
}
