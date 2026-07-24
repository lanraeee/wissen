'use client'

import { useState, useEffect } from 'react'

interface Opportunity {
  id: string
  type: string
  source: string
  title: string
  company: string | null
  url: string
  date_posted: string | null
  eligibility: string
  eligibility_label: string
  tags: string[]
}

interface Props {
  type?: string
  showFilter?: boolean
}

export default function OpportunityGrid({ type, showFilter = true }: Props) {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [localOnly, setLocalOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (localOnly) params.set('local', '1')
    fetch(`/api/opportunities?${params}`)
      .then(r => r.json())
      .then(d => { setOpps(d.opportunities || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [type, localOnly])

  const typeIcon: Record<string, string> = {
    job: '💼', internship: '🎓', scholarship: '🏆', competition: '⚡'
  }

  return (
    <div>
      {showFilter && (
        <div className="pillrow mb-m">
          <a className={`p${!localOnly ? ' active' : ''}`} onClick={() => setLocalOnly(false)} style={{ cursor: 'pointer' }}>All</a>
          <a className={`p${localOnly ? ' active' : ''}`} onClick={() => setLocalOnly(true)} style={{ cursor: 'pointer' }}>Nigeria / Africa</a>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-60)' }}>Loading opportunities…</div>
      ) : opps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-60)' }}>
          <p>No opportunities found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-3" id="oppGrid">
          {opps.map(opp => (
            <a
              key={opp.id}
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              data-opp-type={opp.type}
            >
              <div className="card__body">
                <span className="card__num">{typeIcon[opp.type] || '📌'} {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}</span>
                <h3 className="h4" style={{ marginTop: '.4rem' }}>{opp.title}</h3>
                {opp.company && opp.company !== 'N/A' && (
                  <p style={{ fontSize: '.9rem', color: 'var(--ink-60)', marginTop: '.2rem' }}>{opp.company}</p>
                )}
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.8rem' }}>
                  <span className="badge-free" style={{ background: 'var(--green-100)', color: 'var(--green-700)' }}>
                    {opp.eligibility_label}
                  </span>
                  {opp.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="badge-free">{tag}</span>
                  ))}
                </div>
                {opp.date_posted && (
                  <p style={{ fontSize: '.78rem', color: 'var(--ink-60)', marginTop: '.6rem', fontFamily: 'var(--ff-mono)' }}>
                    {new Date(opp.date_posted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
