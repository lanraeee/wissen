'use client'

import { useState, useEffect, useCallback } from 'react'
import SubmissionActions from '@/components/admin/SubmissionActions'

const TYPES = ['contact', 'volunteer', 'partner', 'donation']

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:  { background: '#fef3c7', color: '#92400e' },
  reviewed: { background: '#d1fae5', color: '#065f46' },
  actioned: { background: '#dbeafe', color: '#1e40af' },
}

interface Submission {
  id: string
  type: string
  name: string
  email: string
  data: Record<string, string>
  status: string
  created_at: string
}

function exportCSV(rows: Submission[], type: string) {
  if (!rows.length) return
  const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r.data))))
  const header = ['name', 'email', 'status', 'created_at', ...allKeys]
  const lines = [
    header.join(','),
    ...rows.map(r =>
      header.map(k => {
        const val = k === 'name' ? r.name : k === 'email' ? r.email : k === 'status' ? r.status : k === 'created_at' ? r.created_at : (r.data[k] ?? '')
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      }).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `submissions-${type}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function AdminSubmissions() {
  const [activeType, setActiveType] = useState('contact')
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/submissions?type=${activeType}`)
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [activeType])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r =>
    !search || `${r.name} ${r.email} ${JSON.stringify(r.data)}`.toLowerCase().includes(search.toLowerCase())
  )

  const counts: Record<string, number> = {}
  rows.forEach(r => { counts[r.status || 'pending'] = (counts[r.status || 'pending'] ?? 0) + 1 })

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Submissions</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>
            {rows.length} records
            {Object.entries(counts).map(([s, n]) => (
              <span key={s} style={{ marginLeft: 10, ...STATUS_COLORS[s], borderRadius: 99, padding: '1px 8px', fontSize: '.72rem', fontWeight: 700 }}>{n} {s}</span>
            ))}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 180 }} />
          <button onClick={() => exportCSV(filtered, activeType)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: activeType === t ? '#1a3c2e' : '#fff',
            color: activeType === t ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc', cursor: 'pointer', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No {activeType} submissions{search ? ' matching your search' : ' yet'}.
            </div>
          )}
          {filtered.map(row => {
            const sc = STATUS_COLORS[row.status || 'pending'] ?? STATUS_COLORS.pending
            return (
              <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.name || row.email}</span>
                    {row.name && row.email && <span style={{ fontSize: '.83rem', color: '#8a9a8f', marginLeft: 8 }}>{row.email}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: '.7rem', fontWeight: 700, textTransform: 'capitalize' }}>{row.status || 'pending'}</span>
                    <span style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at).toLocaleString('en-GB')}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                  {Object.entries(row.data ?? {}).map(([k, v]) => v && (
                    <div key={k}>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>{k}</div>
                      <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                  {row.email && <a href={`mailto:${row.email}`} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>Reply →</a>}
                  <SubmissionActions id={row.id} status={row.status || 'pending'} onRefresh={load} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
