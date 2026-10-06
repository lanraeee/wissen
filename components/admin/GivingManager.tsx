'use client'

import { useState, useEffect, useCallback } from 'react'
import { BROADCAST_PRESETS } from '@/lib/broadcast-messages'

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

interface Contact {
  id: string
  email: string
  name: string | null
  source: string
  status: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained'
  subscribed_at: string
  unsubscribed_at: string | null
}

const CONTACT_STATUS_COLORS: Record<string, { background: string; color: string }> = {
  subscribed:   { background: '#d1fae5', color: '#065f46' },
  unsubscribed: { background: '#f0ece4', color: '#6b6b5c' },
  bounced:      { background: '#fee2e2', color: '#991b1b' },
  complained:   { background: '#fee2e2', color: '#991b1b' },
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
  const [broadcastAudience, setBroadcastAudience] = useState<'pledges_pending' | 'pledges_all' | 'subscribers' | 'users' | 'all'>('pledges_pending')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastBusy, setBroadcastBusy] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState('')

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactBusy, setContactBusy] = useState(false)
  const [contactMsg, setContactMsg] = useState('')

  const [csvBusy, setCsvBusy] = useState(false)
  const [csvResult, setCsvResult] = useState('')

  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [presetKey, setPresetKey] = useState('')

  const loadContacts = useCallback(async () => {
    setContactsLoading(true)
    const res = await fetch('/api/admin/newsletter/subscribers')
    const data = await res.json()
    setContacts(Array.isArray(data.subscribers) ? data.subscribers : [])
    setContactsLoading(false)
  }, [])

  useEffect(() => { loadContacts() }, [loadContacts])

  function applyPreset(key: string) {
    setPresetKey(key)
    const preset = BROADCAST_PRESETS.find(p => p.key === key)
    if (!preset) return
    const projectTitle = projects.find(p => p.slug === broadcastSlug)?.title ?? 'this project'
    setBroadcastMessage(preset.message.replace(/\{\{project\}\}/g, projectTitle))
  }

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
      setBroadcastResult(`Sent to ${data.sent} of ${data.total} recipients${data.failed ? ` (${data.failed} failed)` : ''}.`)
    } catch (err) {
      setBroadcastResult(err instanceof Error ? err.message : 'Broadcast failed')
    }
    setBroadcastBusy(false)
  }

  async function addContact() {
    if (!contactEmail) return
    setContactBusy(true); setContactMsg('')
    try {
      const res = await fetch('/api/admin/newsletter/subscribers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactEmail, name: contactName || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not add contact')
      setContactMsg(data.resubscribed ? 'Re-subscribed' : 'Added')
      setContactName(''); setContactEmail('')
      await loadContacts()
    } catch (err) {
      setContactMsg(err instanceof Error ? err.message : 'Could not add contact')
    }
    setContactBusy(false)
  }

  async function uploadCsv(file: File) {
    setCsvBusy(true); setCsvResult('')
    try {
      const csv = await file.text()
      const res = await fetch('/api/admin/newsletter/subscribers/import-csv', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setCsvResult(`Imported ${data.imported}, skipped ${data.skipped} (already on list), ${data.invalid} invalid.`)
      await loadContacts()
    } catch (err) {
      setCsvResult(err instanceof Error ? err.message : 'Import failed')
    }
    setCsvBusy(false)
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
            <select value={broadcastAudience} onChange={e => setBroadcastAudience(e.target.value as typeof broadcastAudience)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem' }}>
              <option value="pledges_pending">Pledges: pending / declared / lapsed only</option>
              <option value="pledges_all">Pledges: everyone who set one up</option>
              <option value="subscribers">Uploaded / added contacts list</option>
              <option value="users">All registered users (current &amp; future)</option>
              <option value="all">Everyone above, combined</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>Message Style (optional starting point)</label>
          <select value={presetKey} onChange={e => applyPreset(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem' }}>
            <option value="">Write my own / use default…</option>
            {BROADCAST_PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <textarea
          value={broadcastMessage}
          onChange={e => setBroadcastMessage(e.target.value)}
          placeholder="Optional custom message (otherwise a default invite is used)"
          style={{ width: '100%', minHeight: 90, padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem', boxSizing: 'border-box', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={sendBroadcast} disabled={!broadcastSlug || broadcastBusy} style={btn('#1a3c2e')}>
            {broadcastBusy ? 'Sending…' : 'Send Broadcast'}
          </button>
          {broadcastResult && <span style={{ fontSize: '.82rem', color: '#5a6a5f' }}>{broadcastResult}</span>}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Contacts List</h2>
        <p style={{ margin: '0 0 14px', fontSize: '.8rem', color: '#8a9a8f' }}>
          Add people one at a time, or upload a CSV (needs an &quot;email&quot; column; a &quot;name&quot; column is optional). Shared with the newsletter — see{' '}
          <a href="/admin/newsletter?tab=subscribers" style={{ color: '#1a3c2e', fontWeight: 600 }}>all contacts</a>.
        </p>
        <div className="rgrid-2" style={{ gap: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                placeholder="Name (optional)" value={contactName} onChange={e => setContactName(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem' }}
              />
              <input
                placeholder="Email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #d0ccc4', fontSize: '.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={addContact} disabled={!contactEmail || contactBusy} style={btn('#1a3c2e')}>
                {contactBusy ? 'Adding…' : 'Add Contact'}
              </button>
              {contactMsg && <span style={{ fontSize: '.8rem', color: '#5a6a5f' }}>{contactMsg}</span>}
            </div>
          </div>
          <div>
            <input
              type="file" accept=".csv,text/csv"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadCsv(f); e.target.value = '' }}
              disabled={csvBusy}
              style={{ fontSize: '.85rem' }}
            />
            {csvBusy && <div style={{ fontSize: '.8rem', color: '#8a9a8f', marginTop: 6 }}>Importing…</div>}
            {csvResult && <div style={{ fontSize: '.8rem', color: '#5a6a5f', marginTop: 6 }}>{csvResult}</div>}
          </div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #e8e4dc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f' }}>
              {contactsLoading ? 'Loading…' : `${contacts.length} contact${contacts.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e8e4dc', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ background: '#f8f6f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f' }}>Name</th>
                  <th style={{ padding: '8px 12px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f' }}>Email</th>
                  <th style={{ padding: '8px 12px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f' }}>Source</th>
                  <th style={{ padding: '8px 12px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f' }}>Status</th>
                  <th style={{ padding: '8px 12px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f' }}>Added</th>
                </tr>
              </thead>
              <tbody>
                {!contactsLoading && contacts.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#8a9a8f' }}>No contacts yet.</td></tr>
                )}
                {contacts.map(c => {
                  const sc = CONTACT_STATUS_COLORS[c.status] ?? CONTACT_STATUS_COLORS.subscribed
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid #f0ece4' }}>
                      <td style={{ padding: '7px 12px', color: '#1a2e24' }}>{c.name || '—'}</td>
                      <td style={{ padding: '7px 12px', color: '#1a2e24' }}>{c.email}</td>
                      <td style={{ padding: '7px 12px', color: '#8a9a8f' }}>{c.source}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ ...sc, borderRadius: 99, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700 }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '7px 12px', color: '#8a9a8f' }}>{new Date(c.subscribed_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
