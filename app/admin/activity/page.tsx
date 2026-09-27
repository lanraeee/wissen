'use client'

import { useState, useEffect, useMemo } from 'react'

interface ActivityEntry {
  id: string
  actor_email: string
  actor_role: string
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  editor: '#1d4ed8', admin: '#1a3c2e', director: '#B8952A',
}

function actionLabel(action: string) {
  return action.replace(/_/g, ' ').replace(/\./g, ' — ').replace(/\b\w/g, c => c.toUpperCase())
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminActivity() {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null)
  const [viewerTier, setViewerTier] = useState<string>('')
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    fetch('/api/admin/activity').then(r => r.json()).then(data => {
      setEntries(data.entries ?? [])
      setViewerTier(data.viewerTier ?? '')
    })
  }, [])

  const actionTypes = useMemo(() => {
    if (!entries) return []
    return Array.from(new Set(entries.map(e => e.action))).sort()
  }, [entries])

  const filtered = (entries ?? []).filter(e => {
    if (actionFilter && e.action !== actionFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return e.actor_email.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || (e.target_id ?? '').toLowerCase().includes(q)
  })

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Activity Log</h1>
        <p className="admin-page-desc">
          {viewerTier === 'director' && 'Every admin-panel action, across every editor, admin and director.'}
          {viewerTier === 'admin' && "Editors' actions, plus your own. Other admins' and directors' actions are director-only."}
          {viewerTier === 'editor' && 'Your own admin-panel actions.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="admin-input" style={{ maxWidth: 280 }}
          placeholder="Search actor, action, target…" value={query} onChange={e => setQuery(e.target.value)}
        />
        {actionTypes.length > 0 && (
          <select className="admin-input" style={{ maxWidth: 220 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">All actions</option>
            {actionTypes.map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </select>
        )}
        {entries && <span style={{ fontSize: '.82rem', color: '#8a9a8f', alignSelf: 'center' }}>{filtered.length} of {entries.length} entries</span>}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto' }}>
        {entries === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No activity {entries.length > 0 ? 'matches your filters' : 'recorded yet'}.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                {['Actor', 'Action', 'Target', 'Details', 'When'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>
                    <div style={{ fontWeight: 600, color: '#1a2e24' }}>{e.actor_email}</div>
                    <span style={{ background: (ROLE_COLORS[e.actor_role] ?? '#6b7280') + '22', color: ROLE_COLORS[e.actor_role] ?? '#6b7280', borderRadius: 99, padding: '1px 8px', fontSize: '.68rem', fontWeight: 700, textTransform: 'capitalize' }}>{e.actor_role}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#1a2e24' }}>{actionLabel(e.action)}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f' }}>
                    {e.target_type ? `${e.target_type}${e.target_id ? ` · ${e.target_id.slice(0, 12)}` : ''}` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.78rem', color: '#8a9a8f', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }} title={e.details ? JSON.stringify(e.details) : ''}>
                    {e.details ? JSON.stringify(e.details) : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f', whiteSpace: 'nowrap' }} title={new Date(e.created_at).toLocaleString()}>{timeAgo(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
