'use client'

import { useState, useEffect, useCallback } from 'react'

type Entry = {
  id: string
  source: 'server' | 'answer'
  source_key: string | null
  title: string
  body: string
  status: 'active' | 'pending' | 'archived'
  approved_by: string | null
  updated_at: string
}

const FILTERS = ['pending', 'active', 'archived', 'all'] as const

export default function KnowledgeBaseManager({ canEdit }: { canEdit: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<typeof FILTERS[number]>('pending')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/knowledge?status=${filter}`)
      const d = await res.json()
      setEntries(d.entries ?? [])
      setCounts(Object.fromEntries((d.counts ?? []).map((c: { status: string; n: number }) => [c.status, c.n])))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function act(action: string, id?: string) {
    setBusy(id ?? action); setNote('')
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      })
      const d = await res.json()
      if (!res.ok) { setNote(d.error ?? 'Could not do that.'); return }
      if (action === 'rebuild') setNote(`Rebuilt — ${d.written} entries written, ${d.skipped} skipped.`)
      await load()
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
            background: filter === f ? '#1a3c2e' : '#fff', color: filter === f ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc', textTransform: 'capitalize',
          }}>
            {f}{counts[f] != null ? ` (${counts[f]})` : ''}
          </button>
        ))}
        {canEdit && (
          <button onClick={() => act('rebuild')} disabled={busy === 'rebuild'} style={{
            marginLeft: 'auto', background: '#1a3c2e', color: '#f4f0e7', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: '.82rem',
            cursor: busy === 'rebuild' ? 'wait' : 'pointer',
          }}>
            {busy === 'rebuild' ? 'Rebuilding…' : 'Refresh from server'}
          </button>
        )}
      </div>

      {note && <p style={{ fontSize: '.85rem', color: '#1a6b3c', marginBottom: 14 }}>{note}</p>}

      {loading ? <p className="admin-page-desc">Loading…</p>
        : entries.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <p className="admin-page-desc" style={{ margin: 0 }}>
              {filter === 'pending'
                ? 'Nothing waiting for review. Answers the team writes to questions the assistant could not handle show up here.'
                : 'No entries.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {entries.map(e => (
              <div key={e.id} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '.9rem' }}>{e.title}</strong>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
                    color: e.status === 'pending' ? '#b8860b' : e.status === 'active' ? '#1a6b3c' : '#6b7280',
                  }}>{e.status}</span>
                  <span style={{ fontSize: '.7rem', color: '#6b7a70' }}>
                    {e.source === 'answer' ? 'written by the team' : 'from server'}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '.74rem', color: '#6b7a70' }}>
                    {new Date(e.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ fontSize: '.84rem', color: '#3a4a3f', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                  {e.body.length > 400 ? e.body.slice(0, 400) + '…' : e.body}
                </p>

                {canEdit && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {e.status === 'pending' && (
                      <button onClick={() => act('approve', e.id)} disabled={busy === e.id} style={btn('#1a6b3c', '#fff')}>
                        Approve
                      </button>
                    )}
                    {e.status === 'active' && (
                      <button onClick={() => act('archive', e.id)} disabled={busy === e.id} style={btn('#fff', '#3a4a3f')}>
                        Archive
                      </button>
                    )}
                    {e.status === 'archived' && (
                      <button onClick={() => act('restore', e.id)} disabled={busy === e.id} style={btn('#fff', '#3a4a3f')}>
                        Restore
                      </button>
                    )}
                    {/* Server entries would reappear on the next rebuild, so
                        deleting one would be a lie -- only team answers go. */}
                    {e.source === 'answer' && (
                      <button onClick={() => act('delete', e.id)} disabled={busy === e.id} style={btn('#fff', '#a33')}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

function btn(bg: string, fg: string): React.CSSProperties {
  return {
    background: bg, color: fg, border: bg === '#fff' ? '1px solid #e8e4dc' : 'none',
    borderRadius: 6, padding: '6px 14px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
  }
}
