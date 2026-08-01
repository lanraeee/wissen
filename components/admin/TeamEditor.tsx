'use client'

import { useState, useEffect } from 'react'
import type { TeamMember } from '@/app/team/page'

const GROUP_OPTIONS: { value: TeamMember['group']; label: string }[] = [
  { value: 'leadership', label: 'Leadership' },
  { value: 'advisor', label: 'Advisory Board' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'volunteer', label: 'Volunteer' },
]

const DEFAULT_MEMBERS: TeamMember[] = []
const BLANK: TeamMember = { name: '', role: '', group: 'leadership', bio: '', linkedin: '', photo: undefined }

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }

export default function TeamEditor() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<TeamMember>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/team_members').then(r => r.json()).then(res => {
      setMembers(res.value ?? DEFAULT_MEMBERS)
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/team_members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: members }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function startEdit(i: number) { setEditing(i); setDraft(members[i]) }
  function commit() {
    if (editing === -1) setMembers(m => [...m, { ...draft, linkedin: draft.linkedin || undefined }])
    else setMembers(m => m.map((x, i) => i === editing ? { ...draft, linkedin: draft.linkedin || undefined } : x))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { setMembers(m => m.filter((_, j) => j !== i)) }
  function move(i: number, dir: -1 | 1) {
    setMembers(m => {
      const next = [...m]
      const tmp = next[i]; next[i] = next[i + dir]; next[i + dir] = tmp
      return next
    })
  }

  const GROUP_LABEL: Record<TeamMember['group'], string> = {
    leadership: 'Leadership', advisor: 'Advisor', mentor: 'Mentor', volunteer: 'Volunteer',
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Team Members</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([['name', 'Name'], ['role', 'Role / Title'], ['bio', 'Short Bio'], ['linkedin', 'LinkedIn URL (optional)']] as [keyof TeamMember, string][]).map(([k, label]) => (
                    <div key={k} style={k === 'bio' ? { gridColumn: '1 / -1' } : undefined}>
                      <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{label}</label>
                      {k === 'bio'
                        ? <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={draft[k] as string} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                        : <input style={inp} value={(draft[k] ?? '') as string} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                      }
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Group</label>
                    <select style={inp} value={draft.group} onChange={e => setDraft(d => ({ ...d, group: e.target.value as TeamMember['group'] }))}>
                      {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {draft.photo
                        ? <img src={draft.photo} alt={draft.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #d0ccc4' }} />
                        : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0F2D1D,#1a4a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', fontWeight: 800, color: '#B8952A' }}>
                            {draft.name.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                          </div>
                      }
                      <label style={{ ...s('#1a3c2e'), cursor: 'pointer' }}>
                        {draft.photo ? 'Change' : 'Upload'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => setDraft(d => ({ ...d, photo: reader.result as string }))
                          reader.readAsDataURL(file)
                        }} />
                      </label>
                      {draft.photo && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, photo: undefined }))}>✕</button>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={s('#1a3c2e')} onClick={commit}>Save</button>
                  <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {m.photo
                    ? <img src={m.photo} alt={m.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0F2D1D,#1a4a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 800, color: '#B8952A', flexShrink: 0 }}>
                        {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                  }
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '.9rem' }}>{m.name}</strong>
                    <span style={{ fontSize: '.7rem', background: '#e8f0ea', color: '#1a3c2e', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                      {GROUP_LABEL[m.group]}
                    </span>
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{m.role}</div>
                </div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, 1)} disabled={i === members.length - 1}>↓</button>
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
              {([['name', 'Name'], ['role', 'Role / Title'], ['bio', 'Short Bio'], ['linkedin', 'LinkedIn URL (optional)']] as [keyof TeamMember, string][]).map(([k, label]) => (
                <div key={k} style={k === 'bio' ? { gridColumn: '1 / -1' } : undefined}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{label}</label>
                  {k === 'bio'
                    ? <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={draft[k] as string} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                    : <input style={inp} value={(draft[k] ?? '') as string} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                  }
                </div>
              ))}
              <div>
                <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Group</label>
                <select style={inp} value={draft.group} onChange={e => setDraft(d => ({ ...d, group: e.target.value as TeamMember['group'] }))}>
                  {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {draft.photo
                    ? <img src={draft.photo} alt={draft.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #d0ccc4' }} />
                    : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0F2D1D,#1a4a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', fontWeight: 800, color: '#B8952A' }}>
                        {draft.name.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                      </div>
                  }
                  <label style={{ ...s('#1a3c2e'), cursor: 'pointer' }}>
                    {draft.photo ? 'Change' : 'Upload'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => setDraft(d => ({ ...d, photo: reader.result as string }))
                      reader.readAsDataURL(file)
                    }} />
                  </label>
                  {draft.photo && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, photo: undefined }))}>✕</button>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={s('#1a3c2e')} onClick={commit}>Add Member</button>
              <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Member</button>
        )}
      </div>

      {members.length === 0 && editing !== -1 && (
        <p style={{ color: '#8a9a8f', fontSize: '.85rem', marginTop: 12 }}>
          No team members yet. Add people to display them on the public /team page.
        </p>
      )}
    </div>
  )
}
