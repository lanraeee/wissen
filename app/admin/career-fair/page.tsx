'use client'

import { useState, useEffect, useCallback } from 'react'
import { CAREER_INTERESTS, type Booth, type FairEvent } from '@/lib/career-fair-shared'

interface AdminEvent extends FairEvent {
  registration_count: number
  checked_in_count: number
}

interface Registration {
  id: string
  name: string
  email: string | null
  phone: string | null
  school: string
  class_grade: string | null
  career_interest: string | null
  newsletter_opt_in: boolean
  checked_in: boolean
  checked_in_at: string | null
  checkin_token: string
  created_at: string
}

const EMPTY_EVENT: Omit<AdminEvent, 'id' | 'created_at' | 'updated_at' | 'registration_count' | 'checked_in_count'> = {
  slug: '', title: '', school: null, location: null, event_date: null, event_time: null,
  status: 'draft', description: null, booths: [],
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b', published: '#10b981', closed: '#6b7280',
}

const label = (text: string) => <div className="admin-label">{text}</div>
const sectionHead = (text: string) => <div className="admin-section-head">{text}</div>
const addBtn = (onClick: () => void, text: string) => (
  <button type="button" onClick={onClick} className="admin-btn-add">{text}</button>
)
const removeBtn = (onClick: () => void) => (
  <button type="button" onClick={onClick} className="admin-btn-remove">✕</button>
)

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminCareerFair() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<AdminEvent> | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [managing, setManaging] = useState<AdminEvent | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/career-fair/events')
    const data = await res.json()
    setEvents(data.events ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startNew() {
    setEditing({ ...EMPTY_EVENT })
    setErr('')
  }

  function startEdit(e: AdminEvent) {
    setEditing({ ...e })
    setErr('')
  }

  function setField<K extends keyof AdminEvent>(k: K, v: AdminEvent[K]) {
    setEditing(prev => prev ? { ...prev, [k]: v } : prev)
  }

  function updateBooth(i: number, patch: Partial<Booth>) {
    setEditing(prev => {
      if (!prev) return prev
      const booths = (prev.booths ?? []).map((b, idx) => idx === i ? { ...b, ...patch } : b)
      return { ...prev, booths }
    })
  }

  function removeBooth(i: number) {
    setEditing(prev => prev ? { ...prev, booths: (prev.booths ?? []).filter((_, idx) => idx !== i) } : prev)
  }

  function addBooth() {
    setEditing(prev => prev ? {
      ...prev,
      booths: [...(prev.booths ?? []), { id: crypto.randomUUID().slice(0, 8), name: '', category: CAREER_INTERESTS[0], location: '', description: '' }],
    } : prev)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true); setErr('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `/api/admin/career-fair/events/${editing.id}` : '/api/admin/career-fair/events'
      const res = await fetch(url, {
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

  async function handleDelete(id: number) {
    if (!confirm('Delete this fair event and all its registrations? This cannot be undone.')) return
    await fetch(`/api/admin/career-fair/events/${id}`, { method: 'DELETE' })
    await load()
  }

  const e = editing

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Career Clarity Fair</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Manage fair events, booths, registrations, and check-ins.</p>
        </div>
        <button onClick={startNew} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '.88rem', fontWeight: 700, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
          + New Event
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto', marginBottom: 32 }}>
          {events.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No fair events yet. Create your first one above.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  {['Title', 'Date', 'Registrations', 'Checked In', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ padding: '10px 16px', fontSize: '.88rem', fontWeight: 600, color: '#1a2e24' }}>{ev.title}</td>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f', whiteSpace: 'nowrap' }}>
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{ev.registration_count}</td>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{ev.checked_in_count}</td>
                    <td>
                      <span style={{ background: STATUS_COLORS[ev.status] + '22', color: STATUS_COLORS[ev.status], borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize' }}>{ev.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setManaging(ev)} style={{ marginRight: 8, padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#e0f2ea', color: '#0f5132', border: 'none', cursor: 'pointer' }}>Registrations</button>
                      <button onClick={() => startEdit(ev)} style={{ marginRight: 8, padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(ev.id)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Editor modal */}
      {e && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 780, boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a2e24' }}>{e.id ? 'Edit Fair Event' : 'New Fair Event'}</h2>
              <button onClick={() => setEditing(null)} style={{ background: '#f0ece4', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
            </div>

            {sectionHead('Core Details')}
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Title')}
                <input className="admin-input" value={e.title ?? ''} onChange={ev => {
                  const t = ev.target.value
                  setField('title', t)
                  if (!e.id) setField('slug', slugify(t))
                }} />
              </div>
              <div>
                {label('Slug (URL identifier)')}
                <input className="admin-input" value={e.slug ?? ''} onChange={ev => setField('slug', slugify(ev.target.value))} />
              </div>
            </div>
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('School')}
                <input className="admin-input" value={e.school ?? ''} onChange={ev => setField('school', ev.target.value || null)} placeholder="Ibadan Grammar School" />
              </div>
              <div>
                {label('Status')}
                <select className="admin-input" value={e.status ?? 'draft'} onChange={ev => setField('status', ev.target.value as AdminEvent['status'])}>
                  <option value="draft">Draft (not public)</option>
                  <option value="published">Published (open for registration)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="rgrid-3" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Event Date')}
                <input type="date" className="admin-input" value={e.event_date?.slice(0, 10) ?? ''} onChange={ev => setField('event_date', ev.target.value || null)} />
              </div>
              <div>
                {label('Event Time')}
                <input className="admin-input" value={e.event_time ?? ''} onChange={ev => setField('event_time', ev.target.value || null)} placeholder="9:00am – 3:00pm" />
              </div>
              <div>
                {label('Location')}
                <input className="admin-input" value={e.location ?? ''} onChange={ev => setField('location', ev.target.value || null)} placeholder="Ibadan, Oyo State" />
              </div>
            </div>

            {sectionHead('Description')}
            <textarea className="admin-textarea" value={e.description ?? ''} onChange={ev => setField('description', ev.target.value || null)} placeholder="Shown to registrants…" />

            {sectionHead('Booths')}
            {(e.booths ?? []).map((b, i) => (
              <div key={b.id ?? i} style={{ marginBottom: 12, background: '#f9f7f3', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  {label(`Booth ${i + 1}`)}
                  {removeBtn(() => removeBooth(i))}
                </div>
                <div className="rgrid-2" style={{ gap: 8, marginBottom: 8 }}>
                  <input className="admin-input" placeholder="Booth name" value={b.name} onChange={ev => updateBooth(i, { name: ev.target.value })} />
                  <select className="admin-input" value={b.category} onChange={ev => updateBooth(i, { category: ev.target.value })}>
                    {CAREER_INTERESTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="rgrid-2" style={{ gap: 8 }}>
                  <input className="admin-input" placeholder="Location (optional)" value={b.location ?? ''} onChange={ev => updateBooth(i, { location: ev.target.value })} />
                  <input className="admin-input" placeholder="Description (optional)" value={b.description ?? ''} onChange={ev => updateBooth(i, { description: ev.target.value })} />
                </div>
              </div>
            ))}
            {addBtn(addBooth, '+ Add booth')}

            {err && <div style={{ marginTop: 16, color: '#dc2626', fontSize: '.88rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{err}</div>}

            <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '.88rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: '.88rem', fontWeight: 700, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .65 : 1 }}>
                {saving ? 'Saving…' : e.id ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {managing && (
        <RegistrationsPanel event={managing} onClose={() => { setManaging(null); load() }} />
      )}
    </>
  )
}

function RegistrationsPanel({ event, onClose }: { event: AdminEvent; onClose: () => void }) {
  const [regs, setRegs] = useState<Registration[] | null>(null)
  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/career-fair/events/${event.id}/registrations`)
    const data = await res.json()
    setRegs(data.registrations ?? [])
  }, [event.id])

  useEffect(() => { load() }, [load])

  async function toggleCheckedIn(r: Registration) {
    await fetch(`/api/admin/career-fair/registrations/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedIn: !r.checked_in }),
    })
    await load()
  }

  async function handleDeleteReg(id: string) {
    if (!confirm('Remove this registration?')) return
    await fetch(`/api/admin/career-fair/registrations/${id}`, { method: 'DELETE' })
    await load()
  }

  async function handleSendReminders() {
    if (!confirm('Send a check-in reminder email to every not-yet-checked-in registrant?')) return
    setSending(true); setSendResult('')
    try {
      const res = await fetch(`/api/admin/career-fair/events/${event.id}/send-reminders`, { method: 'POST' })
      const data = await res.json()
      setSendResult(`Sent ${data.sent}${data.failed ? `, ${data.failed} failed` : ''}.`)
    } catch {
      setSendResult('Could not send reminders.')
    }
    setSending(false)
  }

  const filtered = (regs ?? []).filter(r => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return r.name.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.school.toLowerCase().includes(q)
  })
  const checkedInCount = (regs ?? []).filter(r => r.checked_in).length

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 960, boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#1a2e24' }}>{event.title} — Registrations</h2>
            <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.85rem' }}>{regs?.length ?? 0} registered · {checkedInCount} checked in</p>
          </div>
          <button onClick={onClose} style={{ background: '#f0ece4', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="admin-input" style={{ maxWidth: 280 }} placeholder="Search name, email, school…" value={query} onChange={ev => setQuery(ev.target.value)} />
          <a href={`/api/admin/career-fair/events/${event.id}/export`} style={{ padding: '7px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', textDecoration: 'none' }}>
            Export CSV
          </a>
          <button onClick={handleSendReminders} disabled={sending} style={{ padding: '7px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#fef3c7', color: '#92400e', border: 'none', cursor: 'pointer', opacity: sending ? .65 : 1 }}>
            {sending ? 'Sending…' : 'Send Check-in Reminders'}
          </button>
          {sendResult && <span style={{ fontSize: '.8rem', color: '#3a4a3f' }}>{sendResult}</span>}
        </div>

        {regs === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No registrations match.</div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  {['Name', 'Contact', 'School', 'Grade', 'Interest', 'Checked In', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ padding: '8px 12px', fontSize: '.85rem', fontWeight: 600, color: '#1a2e24' }}>{r.name}</td>
                    <td style={{ padding: '8px 12px', fontSize: '.8rem', color: '#3a4a3f' }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</td>
                    <td style={{ padding: '8px 12px', fontSize: '.8rem', color: '#3a4a3f' }}>{r.school}</td>
                    <td style={{ padding: '8px 12px', fontSize: '.8rem', color: '#3a4a3f' }}>{r.class_grade ?? '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '.8rem', color: '#3a4a3f' }}>{r.career_interest ?? '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={r.checked_in} onChange={() => toggleCheckedIn(r)} />
                        <span style={{ fontSize: '.78rem', color: r.checked_in ? '#0f5132' : '#8a9a8f' }}>{r.checked_in ? 'Yes' : 'No'}</span>
                      </label>
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleDeleteReg(r.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
