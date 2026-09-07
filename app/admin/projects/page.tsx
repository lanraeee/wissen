'use client'

import { useState, useEffect, useCallback } from 'react'

interface Project {
  id: number
  slug: string
  title: string
  subtitle: string | null
  status: 'draft' | 'published' | 'closed'
  event_name: string | null
  event_date: string | null
  event_location: string | null
  event_time: string | null
  campaign_start: string | null
  campaign_end: string | null
  goal_ngn: number
  raised_ngn: number
  donor_count: number
  hero_desc: string | null
  partnership_name: string | null
  partnership_desc: string | null
  highlights: Array<{ label: string; value: string }>
  what_funded: Array<{ item: string; amount: string }>
  impact_points: string[]
  faq: Array<{ q: string; a: string }>
  created_at: string
  updated_at: string
}

const EMPTY_PROJECT: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
  slug: '', title: '', subtitle: null, status: 'draft',
  event_name: null, event_date: null, event_location: null, event_time: null,
  campaign_start: null, campaign_end: null,
  goal_ngn: 0, raised_ngn: 0, donor_count: 0,
  hero_desc: null, partnership_name: null, partnership_desc: null,
  highlights: [
    { label: 'Students expected', value: '' },
    { label: 'Schools', value: '' },
    { label: 'Career sectors', value: '' },
    { label: 'Event day', value: '' },
  ],
  what_funded: [{ item: '', amount: '' }],
  impact_points: [''],
  faq: [{ q: '', a: '' }],
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b', published: '#10b981', closed: '#6b7280',
}

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 10px', border: '1px solid #d0ccc4', borderRadius: 7,
  fontSize: '.88rem', width: '100%', ...extra,
})
const label = (text: string) => (
  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>{text}</div>
)
const sectionHead = (text: string) => (
  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1a3c2e', marginTop: 24, marginBottom: 10, borderBottom: '1px solid #e8e4dc', paddingBottom: 6 }}>{text}</div>
)
const addBtn = (onClick: () => void, text: string) => (
  <button type="button" onClick={onClick} style={{ fontSize: '.78rem', color: '#1a3c2e', fontWeight: 600, background: '#f0ece4', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', marginTop: 6 }}>{text}</button>
)
const removeBtn = (onClick: () => void) => (
  <button type="button" onClick={onClick} style={{ fontSize: '.72rem', color: '#dc2626', fontWeight: 600, background: '#fee2e2', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>✕</button>
)

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Project> | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/donation-projects')
    const data = await res.json()
    setProjects(data.projects ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startNew() {
    setEditing({ ...EMPTY_PROJECT })
    setErr('')
  }

  function startEdit(p: Project) {
    setEditing({ ...p })
    setErr('')
  }

  function setField<K extends keyof Project>(k: K, v: Project[K]) {
    setEditing(prev => prev ? { ...prev, [k]: v } : prev)
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true); setErr('')
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/donation-projects', {
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
    if (!confirm('Delete this project? This cannot be undone.')) return
    await fetch('/api/admin/donation-projects', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  // JSON array helpers
  function updateArrayItem<T>(arr: T[], i: number, patch: Partial<T>): T[] {
    return arr.map((item, idx) => idx === i ? { ...item, ...patch } : item)
  }
  function removeArrayItem<T>(arr: T[], i: number): T[] {
    return arr.filter((_, idx) => idx !== i)
  }

  const e = editing

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Donation Projects</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Create and publish donation drive campaign pages at /donate/[slug].</p>
        </div>
        <button onClick={startNew} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '.88rem', fontWeight: 700, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
          + New Project
        </button>
      </div>

      {/* Project list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto', marginBottom: 32 }}>
          {projects.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>
              No donation projects yet. Create your first one above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f9f7f3' }}>
                  {['Title', 'Slug', 'Event Date', 'Goal (₦)', 'Raised (₦)', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                    <td style={{ padding: '10px 16px', fontSize: '.88rem', fontWeight: 600, color: '#1a2e24', maxWidth: 220 }}>{p.title}</td>
                    <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f', fontFamily: 'monospace' }}>
                      <a href={`/donate/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>/donate/{p.slug}</a>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f', whiteSpace: 'nowrap' }}>
                      {p.event_date ? new Date(p.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{p.goal_ngn.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{p.raised_ngn.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: STATUS_COLORS[p.status] + '22', color: STATUS_COLORS[p.status], borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize' }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => startEdit(p)} style={{ marginRight: 8, padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>Delete</button>
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
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a2e24' }}>{e.id ? 'Edit Project' : 'New Donation Project'}</h2>
              <button onClick={() => setEditing(null)} style={{ background: '#f0ece4', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
            </div>

            {sectionHead('Core Details')}
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Title')}
                <input style={inp()} value={e.title ?? ''} onChange={ev => {
                  const t = ev.target.value
                  setField('title', t)
                  if (!e.id) setField('slug', slugify(t))
                }} />
              </div>
              <div>
                {label('Slug (URL: /donate/[slug])')}
                <input style={inp()} value={e.slug ?? ''} onChange={ev => setField('slug', slugify(ev.target.value))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              {label('Subtitle (short tagline below title)')}
              <input style={inp()} value={e.subtitle ?? ''} onChange={ev => setField('subtitle', ev.target.value || null)} />
            </div>
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Status')}
                <select style={inp()} value={e.status ?? 'draft'} onChange={ev => setField('status', ev.target.value as Project['status'])}>
                  <option value="draft">Draft (not public)</option>
                  <option value="published">Published (live)</option>
                  <option value="closed">Closed (campaign ended)</option>
                </select>
              </div>
            </div>

            {sectionHead('Hero Description')}
            <textarea style={{ ...inp(), height: 90, resize: 'vertical' }} value={e.hero_desc ?? ''} onChange={ev => setField('hero_desc', ev.target.value || null)} placeholder="The main lead paragraph on the campaign page…" />

            {sectionHead('Event Details')}
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Event Name')}
                <input style={inp()} value={e.event_name ?? ''} onChange={ev => setField('event_name', ev.target.value || null)} placeholder="Career Clarity Fair" />
              </div>
              <div>
                {label('Event Date')}
                <input type="date" style={inp()} value={e.event_date?.slice(0, 10) ?? ''} onChange={ev => setField('event_date', ev.target.value || null)} />
              </div>
              <div>
                {label('Event Location')}
                <input style={inp()} value={e.event_location ?? ''} onChange={ev => setField('event_location', ev.target.value || null)} placeholder="Ibadan, Oyo State" />
              </div>
              <div>
                {label('Event Time')}
                <input style={inp()} value={e.event_time ?? ''} onChange={ev => setField('event_time', ev.target.value || null)} placeholder="8:00am – 5:00pm" />
              </div>
            </div>

            {sectionHead('Campaign Window')}
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Campaign Start Date')}
                <input type="date" style={inp()} value={e.campaign_start?.slice(0, 10) ?? ''} onChange={ev => setField('campaign_start', ev.target.value || null)} />
              </div>
              <div>
                {label('Campaign End Date')}
                <input type="date" style={inp()} value={e.campaign_end?.slice(0, 10) ?? ''} onChange={ev => setField('campaign_end', ev.target.value || null)} />
              </div>
            </div>

            {sectionHead('Funding Numbers')}
            <div className="rgrid-3" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Goal (₦)')}
                <input type="number" style={inp()} value={e.goal_ngn ?? 0} onChange={ev => setField('goal_ngn', Number(ev.target.value))} />
              </div>
              <div>
                {label('Raised (₦) — manual update')}
                <input type="number" style={inp()} value={e.raised_ngn ?? 0} onChange={ev => setField('raised_ngn', Number(ev.target.value))} />
              </div>
              <div>
                {label('Donor Count')}
                <input type="number" style={inp()} value={e.donor_count ?? 0} onChange={ev => setField('donor_count', Number(ev.target.value))} />
              </div>
            </div>

            {sectionHead('Hero Stats Panel (4 figures shown in the sidebar)')}
            {(e.highlights ?? []).map((h, i) => (
              <div key={i} className="rgrid-row-a" style={{ gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input style={inp()} placeholder="Label e.g. Students expected" value={h.label} onChange={ev => setField('highlights', updateArrayItem(e.highlights!, i, { label: ev.target.value }))} />
                <input style={inp()} placeholder="Value e.g. 500–1,000" value={h.value} onChange={ev => setField('highlights', updateArrayItem(e.highlights!, i, { value: ev.target.value }))} />
                {removeBtn(() => setField('highlights', removeArrayItem(e.highlights!, i)))}
              </div>
            ))}
            {addBtn(() => setField('highlights', [...(e.highlights ?? []), { label: '', value: '' }]), '+ Add stat')}

            {sectionHead('What Your Donation Funds (budget lines)')}
            {(e.what_funded ?? []).map((w, i) => (
              <div key={i} className="rgrid-row-b" style={{ gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input style={inp()} placeholder="Line item description" value={w.item} onChange={ev => setField('what_funded', updateArrayItem(e.what_funded!, i, { item: ev.target.value }))} />
                <input style={inp()} placeholder="₦250,000" value={w.amount} onChange={ev => setField('what_funded', updateArrayItem(e.what_funded!, i, { amount: ev.target.value }))} />
                {removeBtn(() => setField('what_funded', removeArrayItem(e.what_funded!, i)))}
              </div>
            ))}
            {addBtn(() => setField('what_funded', [...(e.what_funded ?? []), { item: '', amount: '' }]), '+ Add line')}

            {sectionHead('Impact Points (bullet list in the "Why" section)')}
            {(e.impact_points ?? []).map((pt, i) => (
              <div key={i} className="rgrid-row-c" style={{ gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input style={inp()} placeholder="Impact statement…" value={pt} onChange={ev => {
                  const arr = [...(e.impact_points ?? [])]
                  arr[i] = ev.target.value
                  setField('impact_points', arr)
                }} />
                {removeBtn(() => setField('impact_points', removeArrayItem(e.impact_points!, i)))}
              </div>
            ))}
            {addBtn(() => setField('impact_points', [...(e.impact_points ?? []), '']), '+ Add point')}

            {sectionHead('Partnership (optional featured partner section)')}
            <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                {label('Partner Name')}
                <input style={inp()} value={e.partnership_name ?? ''} onChange={ev => setField('partnership_name', ev.target.value || null)} placeholder="Creele Animation Studios" />
              </div>
            </div>
            {label('Partner Description')}
            <textarea style={{ ...inp(), height: 80, resize: 'vertical', marginBottom: 12 }} value={e.partnership_desc ?? ''} onChange={ev => setField('partnership_desc', ev.target.value || null)} placeholder="What the partner brings and why they matter to this campaign…" />

            {sectionHead('FAQ')}
            {(e.faq ?? []).map((item, i) => (
              <div key={i} style={{ marginBottom: 12, background: '#f9f7f3', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  {label(`Question ${i + 1}`)}
                  {removeBtn(() => setField('faq', removeArrayItem(e.faq!, i)))}
                </div>
                <input style={{ ...inp(), marginBottom: 6 }} placeholder="Question…" value={item.q} onChange={ev => setField('faq', updateArrayItem(e.faq!, i, { q: ev.target.value }))} />
                <textarea style={{ ...inp(), height: 70, resize: 'vertical' }} placeholder="Answer…" value={item.a} onChange={ev => setField('faq', updateArrayItem(e.faq!, i, { a: ev.target.value }))} />
              </div>
            ))}
            {addBtn(() => setField('faq', [...(e.faq ?? []), { q: '', a: '' }]), '+ Add FAQ')}

            {err && <div style={{ marginTop: 16, color: '#dc2626', fontSize: '.88rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{err}</div>}

            <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '.88rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: '.88rem', fontWeight: 700, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .65 : 1 }}>
                {saving ? 'Saving…' : e.id ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
