'use client'

import { useState, useEffect, useCallback } from 'react'
import InboxActions from './InboxActions'

interface InboxRow {
  id: string
  name: string
  email: string
  status: string
  created_at: string
  [key: string]: unknown
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:  { background: '#fef3c7', color: '#92400e' },
  reviewed: { background: '#d1fae5', color: '#065f46' },
  actioned: { background: '#dbeafe', color: '#1e40af' },
}

function exportCSV(rows: InboxRow[], fields: { key: string; label: string }[], resource: string) {
  if (!rows.length) return
  const header = ['name', 'email', 'status', 'created_at', ...fields.map(f => f.key)]
  const lines = [
    header.join(','),
    ...rows.map(r => header.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

/**
 * Generic card-list admin view for a single-file admin resource route
 * (GET list / PATCH status / DELETE, body-`{id}` mutations) -- the same
 * rendering app/admin/submissions/page.tsx used to do per-type via tabs,
 * now one dedicated table/page per form. Kept for contact/volunteer/partner,
 * whose shape is simple and near-identical; donations/bank-transfers/
 * scholarships have bespoke needs and get their own page components.
 */
export default function SimpleInboxList({
  resource, title, endpoint, fields, emptyLabel,
}: {
  resource: string
  title: string
  endpoint: string
  fields: { key: string; label: string }[]
  emptyLabel: string
}) {
  const [rows, setRows] = useState<InboxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(endpoint)
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [endpoint])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r =>
    !search || `${r.name} ${r.email} ${fields.map(f => r[f.key]).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  )

  const counts: Record<string, number> = {}
  rows.forEach(r => { counts[r.status || 'pending'] = (counts[r.status || 'pending'] ?? 0) + 1 })

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-desc">
            {rows.length} records
            {Object.entries(counts).map(([s, n]) => (
              <span key={s} style={{ marginLeft: 10, ...(STATUS_COLORS[s] ?? STATUS_COLORS.pending), borderRadius: 99, padding: '1px 8px', fontSize: '.72rem', fontWeight: 700 }}>{n} {s}</span>
            ))}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 180 }} />
          <button onClick={() => exportCSV(filtered, fields, resource)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-table-empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              {emptyLabel}{search ? ' matching your search' : ''}.
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
                <div className="rgrid-2" style={{ gap: '8px 24px' }}>
                  {fields.map(f => row[f.key] ? (
                    <div key={f.key}>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>{f.label}</div>
                      <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(row[f.key])}</div>
                    </div>
                  ) : null)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                  {row.email ? <a href={`mailto:${row.email}`} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>Reply →</a> : <span />}
                  <InboxActions id={row.id} status={row.status || 'pending'} endpoint={endpoint} onRefresh={load} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
