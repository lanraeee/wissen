'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

// Four rows of the 3-column grid. Enough to show the section has depth,
// short enough that the rest of the page is still reachable -- the whole
// point of the change from "render all 200".
const PAGE_SIZE = 12

export default function OpportunityGrid({ type, showFilter = true }: Props) {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [localOnly, setLocalOnly] = useState(false)

  // Guards against a stale response from a previous filter overwriting the
  // current one: switching tab or filter quickly means two requests are in
  // flight and the slower one can land last.
  const requestRef = useRef(0)

  const load = useCallback(async (offset: number) => {
    const ticket = ++requestRef.current
    if (offset === 0) setLoading(true); else setLoadingMore(true)

    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (type) params.set('type', type)
    if (localOnly) params.set('local', '1')

    try {
      const res = await fetch(`/api/opportunities?${params}`)
      const data = await res.json()
      if (ticket !== requestRef.current) return
      setOpps(prev => offset === 0 ? (data.opportunities ?? []) : [...prev, ...(data.opportunities ?? [])])
      setTotal(data.total ?? 0)
      setHasMore(Boolean(data.hasMore))
    } catch {
      if (ticket === requestRef.current && offset === 0) setOpps([])
    } finally {
      if (ticket === requestRef.current) { setLoading(false); setLoadingMore(false) }
    }
  }, [type, localOnly])

  // Back to the first page whenever the tab or the region filter changes --
  // appending to a list from a different filter would mix them.
  useEffect(() => { load(0) }, [load])

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
        <>
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

          <div style={{ textAlign: 'center', marginTop: '1.6rem' }}>
            <p style={{ fontSize: '.84rem', color: 'var(--ink-60)', margin: '0 0 .8rem' }}>
              Showing {opps.length} of {total}
            </p>
            {hasMore && (
              // A button, not infinite scroll: the footer stays reachable, the
              // browser's back button still lands where you were, and nobody
              // loads 400 cards on a metered connection by scrolling past.
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => load(opps.length)}
                disabled={loadingMore}
                aria-label={`Show ${Math.min(PAGE_SIZE, total - opps.length)} more opportunities`}
              >
                {loadingMore ? 'Loading…' : 'View more'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
