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
  eligibility_label: string
  date_posted: string | null
  first_seen_at: string
}

const TYPE_COLORS: Record<string, string> = {
  job: '#dbeafe', internship: '#fef3c7', scholarship: '#d1fae5', competition: '#fce7f3',
}

export default function AdminOpportunities() {
  const [opps, setOpps] = useState<Opp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/opportunities')
    const data = await res.json()
    setOpps(data.opportunities ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const types = ['all', ...Array.from(new Set(opps.map(o => o.type)))]
  const filtered = opps.filter(o => {
    const matchText = !filter || o.title.toLowerCase().includes(filter.toLowerCase()) || (o.company ?? '').toLowerCase().includes(filter.toLowerCase())
    const matchType = typeFilter === 'all' || o.type === typeFilter
    return matchText && matchType
  })

  function exportCSV() {
    const header = ['title', 'company', 'type', 'source', 'eligibility', 'url', 'date_posted']
    const lines = [header.join(','), ...filtered.map(o =>
      header.map(k => `"${String((o as Record<string, unknown>)[k === 'eligibility' ? 'eligibility_label' : k] ?? '').replace(/"/g, '""')}"`).join(',')
    )]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `opportunities-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Opportunities</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{opps.length} total · {filtered.length} shown · auto-refreshed nightly</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search title or company…" value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 200 }} />
          <button onClick={exportCSV} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: '5px 14px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
            background: typeFilter === t ? '#1a3c2e' : '#fff',
            color: typeFilter === t ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      <OpportunityManager onRefresh={load} />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#f9f7f3' }}>
                {['Title', 'Company', 'Type', 'Eligibility', 'Source', 'Posted', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                  <td style={{ padding: '10px 16px', fontSize: '.88rem', fontWeight: 500, maxWidth: 260 }}>
                    <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e', textDecoration: 'none' }}>{o.title}</a>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{o.company || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: TYPE_COLORS[o.type] ?? '#f0ece4', borderRadius: 99, padding: '2px 8px', fontSize: '.72rem', fontWeight: 600, textTransform: 'capitalize', color: '#1a2e24' }}>{o.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#3a4a3f' }}>{o.eligibility_label}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f', textTransform: 'capitalize' }}>{o.source}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f', whiteSpace: 'nowrap' }}>{o.date_posted ? new Date(o.date_posted).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <OpportunityRowActions id={o.id} onRefresh={load} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#8a9a8f' }}>No opportunities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
