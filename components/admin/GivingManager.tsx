'use client'

import { useState, useEffect, useCallback } from 'react'

interface Pledge {
  id: string
  source_type: 'volunteer' | 'partner'
  source_id: string
  source_label: string | null
  name: string
  email: string
  amount: number
  currency: string
  method: 'stripe' | 'bank_transfer'
  status: 'pending' | 'declared' | 'active' | 'lapsed' | 'cancelled'
  reference: string
  next_due_at: string | null
  reminder_count: number
  last_reminder_at: string | null
  created_at: string
}

interface Project {
  slug: string
  title: string
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:   { background: '#fef3c7', color: '#92400e' },
  declared:  { background: '#dbeafe', color: '#1e40af' },
  active:    { background: '#d1fae5', color: '#065f46' },
  lapsed:    { background: '#fee2e2', color: '#991b1b' },
  cancelled: { background: '#f0ece4', color: '#6b6b5c' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Setup', declared: 'Declared Sent', active: 'Active', lapsed: 'Lapsed', cancelled: 'Cancelled',
}

const FILTERS = ['all', 'pending', 'declared', 'active', 'lapsed', 'cancelled'] as const

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
}

const btn = (bg: string, color = '#fff') => ({ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

export default function GivingManager() {
  const [rows, setRows] = useState<Pledge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [broadcastSlug, setBroadcastSlug] = useState('')
  const [broadcastAudience, setBroadcastAudience] = useState<'pending' | 'all'>('pending')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastBusy, setBroadcastBusy] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/recurring-pledges')
    const data = await res.json()
    setRows(Array.isArray(data.pledges) ? data.pledges : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/admin/donation-projects')
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d.projects) ? d.projects : []))
  }, [])

  async function act(row: Pledge, action: 'confirm' | 'lapse' | 'cancel') {
    const prompts: Record<string, string> = {
      confirm: `Confirm this month's transfer landed for ${row.name}?\n\nThis activates the pledge and rolls it forward to next month.`,
      lapse: `Mark ${row.name}'s pledge as lapsed?`,
      cancel: `Cancel ${row.name}'s monthly pledge?`,
    }
    if (!confirm(prompts[action])) return
    setBusy(row.id); setMsg(null)
    try {
      const res = await fetch(`/api/admin/recurring-pledges/${row.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setMsg({ id: row.id, text: 'Done', ok: true })
      await load()
    } catch (err) {
      setMsg({ id: row.id, text: err instanceof Error ? err.message : 'Action failed', ok: false })
    }
    setBusy(null)
  }

  async function remind(row: Pledge) {
    const note = prompt('Optional note to include in the reminder email:', '') ?? undefined
    setBusy(row.id); setMsg(null)
    try {
      const res = await fetch(`/api/admin/recurring-pledges/${row.id}/remind`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send reminder')
      setMsg({ id: row.id, text: 'Reminder sent', ok: true })
      await load()
    } catch (err) {
      setMsg({ id: row.id, text: err instanceof Error ? err.message : 'Could not send reminder', ok: false })
    }
    setBusy(null)
  }

  async function sendBroadcast() {
    if (!broadcastSlug) return
    setBroadcastBusy(true); setBroadcastResult('')
    try {
      const res = await fetch('/api/admin/recurring-pledges/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug: broadcastSlug, audience: broadcastAudience, message: broadcastMessage || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Broadcast failed')
      setBroadcastResult(`Sent to ${data.sent} of ${data.total} recipients.`)
    } catch (err) {
      setBroadcastResult(err instanceof Error ? err.message : 'Broadcast failed')
    }
    setBroadcastBusy(false)
  }

  const visible = filter === 'all' ? rows : rows.filter(r => r.status === filter)

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 10, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Send a Donation Request</h2>
        <p style={{ margin: '0 0 14px', fontSize: '.8rem', color: '#8a9a8f' }}>
          Email a donation project link to applicants who set up (or haven&apos;t completed) a monthly gift.
        </p>
        <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>Donation Project</label>
            <select value={broadcastSlug} onChange={e => setBroadcastSlug(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem' }}>
              <option value="">Select a project…</option>
              {projects.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>Audience</label>
            <select value={broadcastAudience} onChange={e => setBroadcastAudience(e.target.value as 'pending' | 'all')} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem' }}>
              <option value="pending">Pending / declared / lapsed only</option>
              <option value="all">Everyone who set up a pledge</option>
            </select>
          </div>
        </div>
        <textarea
          value={broadcastMessage}
          onChange={e => setBroadcastMessage(e.target.value)}
          placeholder="Optional custom message (otherwise a default invite is used)"
          style={{ width: '100%', minHeight: 70, padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem', boxSizing: 'border-box', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={sendBroadcast} disabled={!broadcastSlug || broadcastBusy} style={btn('#1a3c2e')}>
            {broadcastBusy ? 'Sending…' : 'Send Broadcast'}
          </button>
          {broadcastResult && <span style={{ fontSize: '.82rem', color: '#5a6a5f' }}>{broadcastResult}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
              background: filter === f ? '#1a3c2e' : '#fff', color: filter === f ? '#f4f0e7' : '#3a4a3f',
              border: '1px solid #e8e4dc', cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-table-empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No pledges in this view.
            </div>
          )}
          {visible.map(row => {
            const sc = STATUS_COLORS[row.status] ?? STATUS_COLORS.pending
            return (
              <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.name}</span>
                    <span style={{ fontSize: '.83rem', color: '#8a9a8f', marginLeft: 8 }}>{row.email}</span>
                    <span style={{ fontSize: '.75rem', color: '#8a9a8f', marginLeft: 8 }}>
                      · {row.source_type === 'volunteer' ? 'Volunteer' : 'Partner'}{row.source_label ? ` (${row.source_label})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: '.7rem', fontWeight: 700 }}>{STATUS_LABELS[row.status]}</span>
                    <span style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
                <div className="rgrid-2" style={{ gap: '8px 24px' }}>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Monthly Amount</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a2e24' }}>{formatMoney(Number(row.amount))}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Method</div>
                    <div style={{ fontSize: '.9rem', color: '#1a2e24' }}>{row.method === 'stripe' ? 'Card (Stripe)' : 'Bank Transfer'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Next Due</div>
                    <div style={{ fontSize: '.85rem', color: '#1a2e24' }}>{row.next_due_at ? new Date(row.next_due_at).toLocaleDateString('en-GB') : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Reference</div>
                    <div style={{ fontSize: '.82rem', fontFamily: 'monospace', color: '#1a2e24' }}>{row.reference}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                  {msg?.id === row.id && <span style={{ fontSize: '.78rem', color: msg.ok ? '#16a34a' : '#dc2626' }}>{msg.text}</span>}
                  {row.status !== 'cancelled' && (
                    <>
                      <button onClick={() => remind(row)} disabled={busy === row.id} style={btn('#f0ece4', '#1a3c2e')}>
                        {busy === row.id ? 'Working…' : 'Send Reminder'}
                      </button>
                      {row.method === 'bank_transfer' && row.status !== 'active' && (
                        <button onClick={() => act(row, 'confirm')} disabled={busy === row.id} style={btn('#1a3c2e')}>
                          ✓ Confirm Received
                        </button>
                      )}
                      {row.status === 'active' && (
                        <button onClick={() => act(row, 'lapse')} disabled={busy === row.id} style={btn('#f0ece4', '#92400e')}>
                          Mark Lapsed
                        </button>
                      )}
                      <button onClick={() => act(row, 'cancel')} disabled={busy === row.id} style={btn('#f0ece4', '#dc2626')}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
