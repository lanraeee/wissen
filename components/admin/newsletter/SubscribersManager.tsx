'use client'

import { useState, useEffect, useCallback } from 'react'

interface Subscriber {
  id: string
  email: string
  name: string | null
  source: string
  status: 'subscribed' | 'unsubscribed'
  subscribed_at: string
  unsubscribed_at: string | null
}

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 10px', border: '1px solid #d0ccc4', borderRadius: 7, fontSize: '.88rem', ...extra,
})

const btn = (bg: string, color = '#fff') => ({
  padding: '6px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
})

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('subscribed')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/newsletter/subscribers')
    const data = await res.json()
    setSubscribers(data.subscribers ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  async function addSubscriber(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const res = await fetch('/api/admin/newsletter/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: name || undefined }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      setErr(d?.error ?? 'Could not add subscriber.')
      return
    }
    setEmail(''); setName('')
    load()
  }

  async function importFromFair() {
    setBusy(true)
    const res = await fetch('/api/admin/newsletter/subscribers/import', { method: 'POST' })
    setBusy(false)
    const d = await res.json().catch(() => null)
    if (res.ok) alert(`Imported ${d?.imported ?? 0} new subscriber(s) from Career Fair opt-ins.`)
    else alert(d?.error ?? 'Import failed.')
    load()
  }

  async function toggleStatus(s: Subscriber) {
    setBusy(true)
    await fetch(`/api/admin/newsletter/subscribers/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s.status === 'subscribed' ? 'unsubscribed' : 'subscribed' }),
    })
    setBusy(false)
    load()
  }

  async function remove(s: Subscriber) {
    if (!confirm(`Remove ${s.email} from the newsletter list entirely? This cannot be undone.`)) return
    setBusy(true)
    await fetch(`/api/admin/newsletter/subscribers/${s.id}`, { method: 'DELETE' })
    setBusy(false)
    load()
  }

  const filtered = (subscribers ?? []).filter(s => statusFilter === 'all' || s.status === statusFilter)
  const activeCount = (subscribers ?? []).filter(s => s.status === 'subscribed').length

  return (
    <div>
      <form onSubmit={addSubscriber} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <input required type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inp({ minWidth: 220 })} />
        <input placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} style={inp({ minWidth: 160 })} />
        <button type="submit" disabled={busy} style={btn('#1a3c2e')}>Add Subscriber</button>
        <button type="button" onClick={importFromFair} disabled={busy} style={btn('#1d4ed8')}>Import Career Fair Opt-Ins</button>
      </form>
      {err && <p style={{ color: '#dc2626', fontSize: '.82rem', marginBottom: 12 }}>{err}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {(['subscribed', 'unsubscribed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            padding: '5px 12px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: '1px solid #d0ccc4', cursor: 'pointer',
            background: statusFilter === f ? '#1a3c2e' : '#fff', color: statusFilter === f ? '#fff' : '#3a4a3f', textTransform: 'capitalize',
          }}>{f}</button>
        ))}
        <span style={{ fontSize: '.8rem', color: '#8a9a8f' }}>{activeCount} active subscriber{activeCount === 1 ? '' : 's'}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto' }}>
        {subscribers === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No subscribers here yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                {['Email', 'Name', 'Source', 'Status', 'Since', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#1a2e24' }}>{s.email}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{s.name ?? '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.78rem', color: '#8a9a8f', textTransform: 'capitalize' }}>{s.source.replace('_', ' ')}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: s.status === 'subscribed' ? '#10b98122' : '#6b728022',
                      color: s.status === 'subscribed' ? '#10b981' : '#6b7280',
                      borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize',
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(s.subscribed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '10px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => toggleStatus(s)} disabled={busy} style={btn('#e8e4dc', '#3a4a3f')}>
                      {s.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}
                    </button>
                    <button onClick={() => remove(s)} disabled={busy} style={btn('#dc2626')}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
