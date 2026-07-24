'use client'

import { useState, useEffect, useCallback } from 'react'
import OpportunityManager from '@/components/admin/OpportunityManager'
import OpportunityRowActions from '@/components/admin/OpportunityRowActions'

interface Opp {
  id: string
  title: string
  company: string | null
  type: string
  source: string
  url: string
  date_posted: string | null
  first_seen_at: string
}

export default function AdminOpportunities() {
  const [opps, setOpps] = useState<Opp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/opportunities?limit=200')
    const data = await res.json()
    setOpps(data.opportunities ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = opps.filter(o =>
    !filter || o.title.toLowerCase().includes(filter.toLowerCase()) || (o.company ?? '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Opportunities</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{opps.length} listings. Auto-refreshed nightly via cron.</p>
        </div>
        <input
          placeholder="Search title or company…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 220 }}
        />
      </div>

      <OpportunityManager onRefresh={load} />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f7f3' }}>
                {['Title', 'Company', 'Type', 'Source', 'Posted', 'Added', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                  <td style={{ padding: '10px 16px', fontSize: '.88rem', fontWeight: 500 }}>
                    <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e', textDecoration: 'none' }}>{o.title}</a>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{o.company || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: '#f0ece4', borderRadius: 99, padding: '2px 8px', fontSize: '.72rem', fontWeight: 600, textTransform: 'capitalize' }}>{o.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f', textTransform: 'capitalize' }}>{o.source}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{o.date_posted ? new Date(o.date_posted).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f' }}>{new Date(o.first_seen_at).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <OpportunityRowActions id={o.id} onRefresh={load} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No opportunities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
