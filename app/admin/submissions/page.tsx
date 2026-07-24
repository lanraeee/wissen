'use client'

import { useState, useEffect, useCallback } from 'react'
import SubmissionActions from '@/components/admin/SubmissionActions'

const TYPES = ['contact', 'volunteer', 'partner', 'donation']

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  reviewed: { bg: '#d1fae5', color: '#065f46' },
  actioned: { bg: '#dbeafe', color: '#1e40af' },
}

interface Submission {
  id: string
  type: string
  data: Record<string, string>
  status: string
  created_at: string
}

export default function AdminSubmissions() {
  const [activeType, setActiveType] = useState('contact')
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/submissions?type=${activeType}`)
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [activeType])

  useEffect(() => { load() }, [load])

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Submissions</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{rows.length} records</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
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
          {rows.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No {activeType} submissions yet.
            </div>
          )}
          {rows.map(row => {
            const sc = STATUS_COLORS[row.status] ?? STATUS_COLORS.pending
            return (
              <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.data.name || row.data.email}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: '.7rem', fontWeight: 700, textTransform: 'capitalize' }}>{row.status}</span>
                    <span style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at).toLocaleString('en-GB')}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                  {Object.entries(row.data).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>{k}</div>
                      <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  {row.data.email && (
                    <a href={`mailto:${row.data.email}`} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>Reply →</a>
                  )}
                  <SubmissionActions id={row.id} status={row.status} onRefresh={load} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
