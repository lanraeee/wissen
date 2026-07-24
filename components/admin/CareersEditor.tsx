'use client'

import { useState, useEffect } from 'react'

interface Role { title: string; type: string; desc: string }

const DEFAULT_ROLES: Role[] = [
  { title: 'Programme Coordinator', type: 'Freelance & Volunteer · Part-time · Ibadan', desc: 'Help deliver our Trade Fair and community events. Background in education or youth work preferred.' },
  { title: 'Content Writer', type: 'Freelance & Volunteer · Remote', desc: 'Create impact stories, blog posts, and educational content that resonates with Nigerian youth.' },
  { title: 'Social Media Manager', type: 'Freelance & Volunteer · Remote · Part-time', desc: 'Grow our Instagram and LinkedIn presence. You know the algorithm and you understand our audience.' },
  { title: 'Partnerships Lead', type: 'Freelance & Volunteer · Hybrid · Lagos or Ibadan', desc: 'Build relationships with schools, companies, and NGOs who want to reach and empower Nigerian youth.' },
  { title: 'Course Curriculum Developer', type: 'Freelance & Volunteer · Remote · Project-based', desc: 'Design practical, engaging course content for our online learning library.' },
  { title: 'Data & Impact Analyst', type: 'Freelance & Volunteer · Remote · Part-time', desc: 'Help us measure what works. Build dashboards, analyse survey data, and write impact reports.' },
]

const DEFAULT_INTERNSHIPS: Role[] = [
  { title: 'Communications Intern', type: '3 months · Remote', desc: 'Support our content team with writing, editing, and managing our newsletter and social posts.' },
  { title: 'Research Intern', type: '3-6 months · Remote', desc: 'Assist the policy team with desk research, literature reviews, and survey analysis.' },
  { title: 'Technology Intern', type: '3 months · Remote', desc: 'Help maintain and improve our web platform. Next.js, TypeScript, and Postgres experience helpful.' },
]

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
})

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }

const BLANK: Role = { title: '', type: '', desc: '' }

function RoleList({ roles, onChange }: { roles: Role[]; onChange: (r: Role[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<Role>(BLANK)

  function startEdit(i: number) { setEditing(i); setDraft(roles[i]) }
  function save() {
    if (editing === -1) onChange([...roles, draft])
    else onChange(roles.map((r, i) => i === editing ? draft : r))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { onChange(roles.filter((_, j) => j !== i)) }
  function move(i: number, dir: -1 | 1) {
    const arr = [...roles]
    ;[arr[i], arr[i + dir]] = [arr[i + dir], arr[i]]
    onChange(arr)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {roles.map((r, i) => (
        <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
          {editing === i ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['title', 'type', 'desc'] as const).map(k => (
                <div key={k}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{k}</label>
                  {k === 'desc'
                    ? <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                    : <input style={inp} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                  }
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={s('#1a3c2e')} onClick={save}>Save</button>
                <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{r.title}</div>
                <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{r.type}</div>
                <div style={{ fontSize: '.83rem', color: '#3a4a3f', marginTop: 4 }}>{r.desc}</div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {i > 0 && <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => move(i, -1)}>↑</button>}
                {i < roles.length - 1 && <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => move(i, 1)}>↓</button>}
                <button style={s('#1d4ed8')} onClick={() => startEdit(i)}>Edit</button>
                <button style={s('#dc2626')} onClick={() => remove(i)}>✕</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editing === -1 ? (
        <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['title', 'type', 'desc'] as const).map(k => (
            <div key={k}>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{k}</label>
              {k === 'desc'
                ? <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
                : <input style={inp} value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
              }
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={s('#1a3c2e')} onClick={save}>Add</button>
            <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Role</button>
      )}
    </div>
  )
}

export default function CareersEditor() {
  const [roles, setRoles] = useState<Role[]>([])
  const [internships, setInternships] = useState<Role[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/careers_roles').then(r => r.json()),
      fetch('/api/admin/content/careers_internships').then(r => r.json()),
    ]).then(([rolesRes, internsRes]) => {
      setRoles(rolesRes.value ?? DEFAULT_ROLES)
      setInternships(internsRes.value ?? DEFAULT_INTERNSHIPS)
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await Promise.all([
      fetch('/api/admin/content/careers_roles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: roles }) }),
      fetch('/api/admin/content/careers_internships', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: internships }) }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Careers Page Content</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save All Changes'}</button>
        </div>
      </div>

      <h3 style={{ fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f', margin: '0 0 12px' }}>Freelance &amp; Volunteer Roles</h3>
      <RoleList roles={roles} onChange={setRoles} />

      <h3 style={{ fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f', margin: '28px 0 12px' }}>Internships</h3>
      <RoleList roles={internships} onChange={setInternships} />
    </div>
  )
}
