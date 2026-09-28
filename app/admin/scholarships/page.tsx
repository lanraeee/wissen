'use client'

import { useState, useEffect, useCallback } from 'react'
import { RED_FLAG_LABELS, SCORE_MAX, type RedFlag, type ScoreBreakdown } from '@/lib/scholarship-shared'

interface Application {
  id: string
  name: string
  email: string
  phone: string | null
  age_range: string | null
  country: string | null
  state_region: string | null
  city: string | null
  answers: Record<string, unknown>
  score: number
  score_breakdown: ScoreBreakdown
  red_flags: RedFlag[]
  status: 'pending' | 'shortlisted' | 'awarded' | 'declined' | 'waitlisted'
  created_at: string
}

const STATUS_OPTIONS = ['pending', 'shortlisted', 'awarded', 'declined', 'waitlisted'] as const

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:     { background: '#fef3c7', color: '#92400e' },
  shortlisted: { background: '#dbeafe', color: '#1e40af' },
  awarded:     { background: '#d1fae5', color: '#065f46' },
  declined:    { background: '#f0ece4', color: '#6b6b5c' },
  waitlisted:  { background: '#ede9fe', color: '#5b21b6' },
}

const ANSWER_LABELS: Record<string, string> = {
  currentStatus: 'Current status', educationLevel: 'Education level', fieldOfStudy: 'Field of study/profession',
  learningGoals: 'What they want to learn', experienceLevel: 'Experience level', goalsEssay: 'What DataCamp would help them achieve',
  whyApplyingEssay: 'Why they are applying', situation: 'Situation', accessMethod: 'How they would access DataCamp otherwise',
  weeklyHours: 'Weekly time commitment', deviceAccess: 'Device access', internetAccess: 'Internet access', planEssay: 'What they will do differently',
  visionEssay: 'Where they see themselves in 12 months', impactEssay: 'How this could benefit others',
  priorCourses: 'Completed online courses before?', priorCoursesDetail: 'Prior course details',
  evidenceTypes: 'Evidence of interest', evidenceUrl: 'Evidence link', tieBreakerEssay: 'Why they should receive this scholarship',
  agreeCommitments: 'Agreed to commitments', agreeNoResale: 'Agreed not to resell access',
  consentContact: 'Consented to contact', consentSuccessStory: 'Consented to share success story',
}

const CRITERION_LABELS: Record<keyof ScoreBreakdown, string> = {
  financialNeed: 'Financial/access need', motivation: 'Motivation', careerGoals: 'Career/education goals',
  commitment: 'Commitment to learning', potentialImpact: 'Potential impact', existingInitiative: 'Existing initiative',
}

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v ?? '')
}

function exportCSV(rows: Application[]) {
  if (!rows.length) return
  const header = ['name', 'email', 'score', 'status', 'red_flags', 'country', 'created_at']
  const lines = [
    header.join(','),
    ...rows.map(r => [r.name, r.email, r.score, r.status, r.red_flags.join('; '), r.country ?? '', r.created_at]
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `scholarship-applications-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function AdminScholarships() {
  const [rows, setRows] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/scholarships')
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function setStatus(id: string, status: string) {
    await fetch('/api/admin/scholarships', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await load()
  }

  async function del(id: string) {
    if (!confirm('Delete this application?')) return
    await fetch('/api/admin/scholarships', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  const filtered = rows
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => !search || `${r.name} ${r.email} ${r.country ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  const counts: Record<string, number> = {}
  rows.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1 })

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="admin-page-title">Scholarship Applications</h1>
          <p className="admin-page-desc">
            {rows.length} applications, sorted by score
            {Object.entries(counts).map(([s, n]) => (
              <span key={s} style={{ marginLeft: 10, ...(STATUS_COLORS[s] ?? STATUS_COLORS.pending), borderRadius: 99, padding: '1px 8px', fontSize: '.72rem', fontWeight: 700 }}>{n} {s}</span>
            ))}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 180 }} />
          <button onClick={() => exportCSV(filtered)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '5px 14px', borderRadius: 99, fontSize: '.8rem', fontWeight: 600, textTransform: 'capitalize',
            background: statusFilter === s ? '#1a3c2e' : '#fff', color: statusFilter === s ? '#fff' : '#3a4a3f',
            border: '1px solid #e8e4dc', cursor: 'pointer',
          }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-table-empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No applications{search || statusFilter !== 'all' ? ' matching your filters' : ' yet'}.
            </div>
          )}
          {filtered.map(row => {
            const isOpen = expanded === row.id
            return (
              <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.name}</span>
                    <span style={{ fontSize: '.83rem', color: '#8a9a8f', marginLeft: 8 }}>{row.email}</span>
                    {row.country && <span style={{ fontSize: '.78rem', color: '#8a9a8f', marginLeft: 8 }}>· {[row.city, row.state_region, row.country].filter(Boolean).join(', ')}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1a3c2e' }}>{row.score}<span style={{ fontSize: '.7rem', color: '#8a9a8f', fontWeight: 500 }}>/100</span></span>
                    <select value={row.status} onChange={e => setStatus(row.id, e.target.value)} style={{
                      ...STATUS_COLORS[row.status], border: 'none', borderRadius: 99, padding: '3px 10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer',
                    }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {row.red_flags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {row.red_flags.map(f => (
                      <span key={f} title={RED_FLAG_LABELS[f] ?? f} style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 99, padding: '2px 10px', fontSize: '.7rem', fontWeight: 700 }}>
                        🚩 {RED_FLAG_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <button onClick={() => setExpanded(isOpen ? null : row.id)} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {isOpen ? 'Hide full application ↑' : 'View full application ↓'}
                  </button>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <a href={`mailto:${row.email}`} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>Reply →</a>
                    <button onClick={() => del(row.id)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0ece4' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 8 }}>Score breakdown</div>
                    <div className="rgrid-2" style={{ gap: '6px 24px', marginBottom: 20 }}>
                      {(Object.keys(CRITERION_LABELS) as (keyof ScoreBreakdown)[]).map(k => (
                        <div key={k} style={{ fontSize: '.85rem', color: '#1a2e24' }}>
                          {CRITERION_LABELS[k]}: <strong>{row.score_breakdown[k]}</strong>/{SCORE_MAX[k]}
                        </div>
                      ))}
                    </div>
                    <div className="rgrid-2" style={{ gap: '10px 24px' }}>
                      {row.phone && (
                        <div>
                          <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Phone</div>
                          <div style={{ fontSize: '.88rem', color: '#1a2e24' }}>{row.phone}</div>
                        </div>
                      )}
                      {Object.entries(ANSWER_LABELS).map(([key, label]) => {
                        const value = row.answers[key]
                        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return null
                        return (
                          <div key={key} style={{ gridColumn: key.endsWith('Essay') ? '1 / -1' : undefined }}>
                            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>{label}</div>
                            <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatValue(value)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
