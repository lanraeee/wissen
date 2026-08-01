'use client'

import { useState, useEffect } from 'react'

interface WAPost {
  text: string
  date: string
  image?: string
}

interface WAChannel {
  url: string
  name: string
  description: string
  posts: WAPost[]
}

const DEFAULTS: WAChannel = {
  url: '',
  name: 'Wissen-Haus',
  description: 'Career tips, opportunities and community updates — straight from the Wissen-Haus team.',
  posts: [],
}

const BLANK_POST: WAPost = { text: '', date: new Date().toISOString().slice(0, 10) }

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const lbl = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em', display: 'block', marginBottom: 3 }
const s = (bg: string, color = '#fff') => ({ padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

export default function WhatsAppEditor() {
  const [data, setData] = useState<WAChannel>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<WAPost>(BLANK_POST)

  useEffect(() => {
    fetch('/api/admin/content/whatsapp_channel').then(r => r.json()).then(res => {
      if (res.value) setData({ ...DEFAULTS, ...res.value })
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/whatsapp_channel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: data }),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  function commitPost() {
    if (editing === -1) setData(d => ({ ...d, posts: [{ ...draft }, ...d.posts] }))
    else setData(d => ({ ...d, posts: d.posts.map((p, i) => i === editing ? { ...draft } : p) }))
    setEditing(null); setDraft(BLANK_POST)
  }

  function removePost(i: number) { setData(d => ({ ...d, posts: d.posts.filter((_, j) => j !== i) })) }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>WhatsApp Channel</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      {/* Channel settings */}
      <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '16px', marginBottom: 24 }}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Channel Settings</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>WhatsApp Channel URL</label>
            <input style={inp} placeholder="https://whatsapp.com/channel/..." value={data.url} onChange={e => setData(d => ({ ...d, url: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Channel Name</label>
            <input style={inp} value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Short Description</label>
            <input style={inp} value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f' }}>Channel Posts ({data.posts.length})</div>
        {editing !== -1 && (
          <button style={s('#25D366')} onClick={() => { setEditing(-1); setDraft(BLANK_POST) }}>+ Add Post</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Add / edit form */}
        {editing === -1 && (
          <div style={{ background: '#e8faf0', border: '1px solid #25D366', borderRadius: 8, padding: '14px' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#128C7E', marginBottom: 10 }}>New Post</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={lbl}>Message text</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Type the post content…" value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" style={inp} value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Image (optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {draft.image && <img src={draft.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                    <label style={{ ...s('#e8e4dc', '#3a4a3f'), cursor: 'pointer' }}>
                      {draft.image ? 'Change' : 'Upload'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setDraft(d => ({ ...d, image: reader.result as string }))
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                    {draft.image && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, image: undefined }))}>✕</button>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={s('#25D366')} onClick={commitPost} disabled={!draft.text.trim()}>Add Post</button>
                <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK_POST) }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {data.posts.length === 0 && editing !== -1 && (
          <p style={{ color: '#8a9a8f', fontSize: '.85rem' }}>No posts yet. Add your first post above.</p>
        )}

        {data.posts.map((post, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={lbl}>Message text</label>
                  <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={lbl}>Date</label>
                    <input type="date" style={inp} value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>Image (optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {draft.image && <img src={draft.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                      <label style={{ ...s('#e8e4dc', '#3a4a3f'), cursor: 'pointer' }}>
                        {draft.image ? 'Change' : 'Upload'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => setDraft(d => ({ ...d, image: reader.result as string }))
                          reader.readAsDataURL(file)
                        }} />
                      </label>
                      {draft.image && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, image: undefined }))}>✕</button>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={s('#25D366')} onClick={commitPost}>Save</button>
                  <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {post.image && <img src={post.image} alt="" style={{ width: '100%', maxWidth: 200, height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />}
                  <p style={{ margin: '0 0 4px', fontSize: '.85rem', whiteSpace: 'pre-wrap' }}>{post.text}</p>
                  <span style={{ fontSize: '.7rem', color: '#8a9a8f' }}>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button style={s('#1d4ed8')} onClick={() => { setEditing(i); setDraft({ ...post }) }}>Edit</button>
                  <button style={s('#dc2626')} onClick={() => removePost(i)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
