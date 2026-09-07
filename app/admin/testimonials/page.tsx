'use client'

import { useState, useEffect, useCallback } from 'react'

interface Testimonial {
  id: number
  name: string
  role: string | null
  quote: string
  avatar_url: string | null
  rating: number | null
  source: 'admin' | 'candidate'
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

const EMPTY: Omit<Testimonial, 'id' | 'created_at' | 'updated_at' | 'source'> = {
  name: '', role: null, quote: '', avatar_url: null, rating: 5, status: 'approved', featured: false, sort_order: 0,
}

const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#dc2626' }

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 10px', border: '1px solid #d0ccc4', borderRadius: 7,
  fontSize: '.88rem', width: '100%', ...extra,
})
const label = (text: string) => (
  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>{text}</div>
)

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/testimonials')
    const data = await res.json()
    setItems(data.testimonials ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startNew() {
    setEditing({ ...EMPTY, source: 'admin' } as Partial<Testimonial>)
    setErr('')
  }

  function startEdit(t: Testimonial) {
    setEditing({ ...t })
    setErr('')
  }

  function setField<K extends keyof Testimonial>(k: K, v: Testimonial[K]) {
    setEditing(prev => prev ? { ...prev, [k]: v } : prev)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true); setErr('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/testimonials', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setEditing(null)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
    }
    setSaving(false)
  }

  async function setStatus(id: number, status: Testimonial['status']) {
    await fetch('/api/admin/testimonials', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await load()
  }

  async function toggleFeatured(t: Testimonial) {
    await fetch('/api/admin/testimonials', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, featured: !t.featured }),
    })
    await load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return
    await fetch('/api/admin/testimonials', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  const e = editing
  const filtered = filter === 'all' ? items : items.filter(t => t.status === filter)
  const pendingCount = items.filter(t => t.status === 'pending').length

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Testimonials</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Manage the story carousel on the homepage and review candidate submissions.</p>
        </div>
        <button onClick={startNew} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '.88rem', fontWeight: 700, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
          + New Testimonial
        </button>
      </div>

      <div className="pillrow mb-l" style={{ marginBottom: 16 }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: 'none', cursor: 'pointer', marginRight: 8,
            background: filter === f ? '#1a3c2e' : '#f0ece4', color: filter === f ? '#f4f0e7' : '#3a4a3f', textTransform: 'capitalize',
          }}>
            {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto', marginBottom: 32 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No testimonials here yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: '#f9f7f3' }}>
                  {['Name', 'Quote', 'Source', 'Status', 'Featured', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                    <td style={{ padding: '10px 16px', fontSize: '.88rem', fontWeight: 600, color: '#1a2e24', whiteSpace: 'nowrap' }}>
                      {t.name}
                      {t.role && <div style={{ fontSize: '.76rem', fontWeight: 400, color: '#8a9a8f' }}>{t.role}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#3a4a3f', maxWidth: 320 }}>
                      {t.quote.length > 110 ? t.quote.slice(0, 110) + '…' : t.quote}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.78rem', color: '#8a9a8f', textTransform: 'capitalize' }}>{t.source}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: STATUS_COLORS[t.status] + '22', color: STATUS_COLORS[t.status], borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize' }}>{t.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button onClick={() => toggleFeatured(t)} title="Toggle featured" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: t.featured ? '#E0A83E' : '#d0ccc4' }}>★</button>
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      {t.status === 'pending' && (
                        <>
                          <button onClick={() => setStatus(t.id, 'approved')} style={{ marginRight: 6, padding: '4px 10px', borderRadius: 6, fontSize: '.76rem', fontWeight: 600, background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => setStatus(t.id, 'rejected')} style={{ marginRight: 6, padding: '4px 10px', borderRadius: 6, fontSize: '.76rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                      <button onClick={() => startEdit(t)} style={{ marginRight: 6, padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(t.id)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {e && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 560, boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a2e24' }}>{e.id ? 'Edit Testimonial' : 'New Testimonial'}</h2>
              <button onClick={() => setEditing(null)} style={{ background: '#f0ece4', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
            </div>

            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Name')}
                <input style={inp()} value={e.name ?? ''} onChange={ev => setField('name', ev.target.value)} />
              </div>
              <div>
                {label('Role / Title')}
                <input style={inp()} value={e.role ?? ''} onChange={ev => setField('role', ev.target.value || null)} placeholder="SS3 Student, Career Clarity Fair" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              {label('Quote')}
              <textarea style={{ ...inp(), height: 100, resize: 'vertical' }} value={e.quote ?? ''} onChange={ev => setField('quote', ev.target.value)} />
            </div>

            <div className="rgrid-3" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Rating (1-5)')}
                <input type="number" min={1} max={5} style={inp()} value={e.rating ?? ''} onChange={ev => setField('rating', ev.target.value ? Number(ev.target.value) : null)} />
              </div>
              <div>
                {label('Status')}
                <select style={inp()} value={e.status ?? 'approved'} onChange={ev => setField('status', ev.target.value as Testimonial['status'])}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                {label('Sort Order')}
                <input type="number" style={inp()} value={e.sort_order ?? 0} onChange={ev => setField('sort_order', Number(ev.target.value))} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!e.featured} onChange={ev => setField('featured', ev.target.checked)} />
                Featured (shown first in the carousel)
              </label>
            </div>

            {err && <div style={{ marginTop: 8, color: '#dc2626', fontSize: '.88rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{err}</div>}

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '.88rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: '.88rem', fontWeight: 700, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .65 : 1 }}>
                {saving ? 'Saving…' : e.id ? 'Save Changes' : 'Create Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
