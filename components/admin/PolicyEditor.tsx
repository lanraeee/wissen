'use client'

import { useState, useEffect } from 'react'

interface Paper {
  date: string
  tag: string
  no: string
  theme: string
  title: string
  subtitle: string
  status: 'completed' | 'upcoming'
}

const DEFAULT_PAPERS: Paper[] = [
  { date: 'Mar 2025', tag: 'Published', no: '001', theme: 'Youth Employability', title: 'Beyond Unemployment', subtitle: 'A Skills-First Framework for Nigerian Youth Economic Independence', status: 'completed' },
  { date: 'May 2025', tag: 'Upcoming', no: '002', theme: 'Artificial Intelligence', title: "AI Won't Steal Nigeria's Future", subtitle: 'Poor Preparation Will', status: 'upcoming' },
  { date: 'Jul 2025', tag: 'Upcoming', no: '003', theme: 'Career Development', title: 'Degrees Without Direction', subtitle: 'Rethinking the Path from Education to Employment', status: 'upcoming' },
  { date: 'Sep 2025', tag: 'Upcoming', no: '004', theme: 'Digital Skills', title: 'Skills for Tomorrow', subtitle: 'Building a Digitally-Ready Nigerian Workforce', status: 'upcoming' },
]

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
})

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }

const BLANK: Paper = { date: '', tag: 'Upcoming', no: '', theme: '', title: '', subtitle: '', status: 'upcoming' }

export default function PolicyEditor() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<Paper>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/policy_papers').then(r => r.json()).then(res => {
      setPapers(res.value ?? DEFAULT_PAPERS)
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/policy_papers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: papers }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function startEdit(i: number) { setEditing(i); setDraft(papers[i]) }
  function commit() {
    if (editing === -1) setPapers(p => [...p, draft])
    else setPapers(p => p.map((x, i) => i === editing ? draft : x))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { setPapers(p => p.filter((_, j) => j !== i)) }

  const fields: [keyof Paper, string][] = [
    ['no', 'Paper No'], ['date', 'Date'], ['theme', 'Theme'],
    ['title', 'Title'], ['subtitle', 'Subtitle'], ['tag', 'Tag Label'],
  ]

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Policy &amp; Research Timeline</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {papers.map((p, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {fields.map(([k, label]) => (
                    <div key={k}>
                      <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{label}</label>
                      <input style={inp} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Status</label>
                    <select style={inp} value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as Paper['status'] }))}>
                      <option value="completed">Completed / Published</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={s('#1a3c2e')} onClick={commit}>Save</button>
                  <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#8a9a8f', marginRight: 8 }}>{p.no}</span>
                  <strong style={{ fontSize: '.9rem' }}>{p.title}</strong>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{p.theme} · {p.date} · {p.tag}</div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={s('#1d4ed8')} onClick={() => startEdit(i)}>Edit</button>
                  <button style={s('#dc2626')} onClick={() => remove(i)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editing === -1 ? (
          <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {fields.map(([k, label]) => (
                <div key={k}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{label}</label>
                  <input style={inp} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={s('#1a3c2e')} onClick={commit}>Add</button>
              <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Paper</button>
        )}
      </div>
    </div>
  )
}
