'use client'

import { useState, useEffect } from 'react'

interface Thread { title: string; author: string; replies: number; tag: string }

const DEFAULTS: Thread[] = [
  { title: 'How do I get my first remote job with no experience?', author: 'Adaeze O.', replies: 12, tag: 'Jobs' },
  { title: "Share your JAMB score and what you studied — let's see the range!", author: 'Kola A.', replies: 34, tag: 'Education' },
  { title: 'Best free resources to learn Python in 2025', author: 'Emeka N.', replies: 8, tag: 'Tech' },
  { title: "I got a scholarship! Here's what I learned from the application process", author: 'Fatima A.', replies: 21, tag: 'Scholarships' },
  { title: 'Anyone else using AI tools to improve their CV?', author: 'Seun B.', replies: 15, tag: 'Career' },
  { title: 'Is Lagos really necessary for a tech career in Nigeria?', author: 'Yusuf I.', replies: 27, tag: 'Discussion' },
]

const BLANK: Thread = { title: '', author: '', replies: 0, tag: 'Discussion' }
const TAGS = ['Jobs', 'Education', 'Tech', 'Scholarships', 'Career', 'Discussion', 'Community', 'Opportunities']
const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const s = (bg: string, color = '#fff') => ({ padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' })

export default function ThreadsEditor() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<Thread>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/community_threads').then(r => r.json()).then(res => {
      setThreads(res.value ?? DEFAULTS)
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/community_threads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: threads }),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  function commit() {
    if (editing === -1) setThreads(t => [...t, draft])
    else setThreads(t => t.map((x, i) => i === editing ? draft : x))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { setThreads(t => t.filter((_, j) => j !== i)) }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Community Threads</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {threads.map((t, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Title</label>
                  <input style={inp} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Author</label>
                  <input style={inp} value={draft.author} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Replies</label>
                  <input type="number" style={inp} value={draft.replies} onChange={e => setDraft(d => ({ ...d, replies: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Tag</label>
                  <select style={inp} value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))}>
                    {TAGS.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 6 }}>
                  <button style={s('#1a3c2e')} onClick={commit}>Save</button>
                  <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, background: '#e8e4dc', borderRadius: 4, padding: '1px 6px', marginRight: 8 }}>{t.tag}</span>
                  <strong style={{ fontSize: '.88rem' }}>{t.title}</strong>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 3 }}>By {t.author} · {t.replies} replies</div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={s('#1d4ed8')} onClick={() => { setEditing(i); setDraft(t) }}>Edit</button>
                  <button style={s('#dc2626')} onClick={() => remove(i)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editing === -1 ? (
          <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Title</label>
              <input style={inp} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Author</label>
              <input style={inp} value={draft.author} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Replies</label>
              <input type="number" style={inp} value={draft.replies} onChange={e => setDraft(d => ({ ...d, replies: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Tag</label>
              <select style={inp} value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))}>
                {TAGS.map(tg => <option key={tg} value={tg}>{tg}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 6 }}>
              <button style={s('#1a3c2e')} onClick={commit}>Add Thread</button>
              <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Thread</button>
        )}
      </div>
    </div>
  )
}
