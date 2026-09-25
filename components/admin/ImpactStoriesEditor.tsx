'use client'

import { useState, useEffect } from 'react'

interface Story {
  name: string
  role: string
  desc: string
}

const BLANK: Story = { name: '', role: '', desc: '' }

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const lbl = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em' }

export default function ImpactStoriesEditor() {
  const [stories, setStories] = useState<Story[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<Story>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/impact_stories').then(r => r.json()).then(res => {
      setStories(res.value ?? [])
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/impact_stories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: stories }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function startEdit(i: number) { setEditing(i); setDraft(stories[i]) }
  function commit() {
    if (editing === -1) setStories(s => [...s, { ...draft }])
    else setStories(s => s.map((x, i) => i === editing ? { ...draft } : x))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { setStories(s => s.filter((_, j) => j !== i)) }
  function move(i: number, dir: -1 | 1) {
    setStories(s => {
      const next = [...s]
      const tmp = next[i]; next[i] = next[i + dir]; next[i + dir] = tmp
      return next
    })
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const fields: [keyof Story, string, boolean][] = [
    ['name', 'Name', false],
    ['role', 'Role / Title', false],
    ['desc', 'Story Description', true],
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Impact Stories</h2>
          <p style={{ margin: 0, fontSize: '.83rem', color: '#8a9a8f' }}>Stories displayed on the public /impact-content page.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stories.map((story, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {fields.map(([k, label, multiline]) => (
                    <div key={k} style={multiline ? { gridColumn: '1 / -1' } : {}}>
                      <label style={lbl}>{label}</label>
                      {multiline
                        ? <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                        : <input style={inp} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                      }
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={s('#1a3c2e')} onClick={commit}>Save</button>
                  <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '.9rem' }}>{story.name}</strong>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{story.role}</div>
                  <div style={{ fontSize: '.8rem', color: '#3a4a3f', marginTop: 4, maxWidth: 480 }}>{story.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, 1)} disabled={i === stories.length - 1}>↓</button>
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
              {fields.map(([k, label, multiline]) => (
                <div key={k} style={multiline ? { gridColumn: '1 / -1' } : {}}>
                  <label style={lbl}>{label}</label>
                  {multiline
                    ? <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                    : <input style={inp} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                  }
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={s('#1a3c2e')} onClick={commit}>Add Story</button>
              <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Story</button>
        )}
      </div>

      {stories.length === 0 && editing !== -1 && (
        <p style={{ color: '#8a9a8f', fontSize: '.85rem', marginTop: 12 }}>
          No stories yet. Add one to display it on the public /impact-content page.
        </p>
      )}
    </div>
  )
}
