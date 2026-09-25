'use client'

import { useState, useEffect } from 'react'

interface Partner {
  name: string
  logo: string
  logoInverted?: string
  description?: string
  url?: string
}

const BLANK: Partner = { name: '', logo: '', logoInverted: '', description: '', url: '' }

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }

export default function PartnersEditor() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partner>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/partners').then(r => r.json()).then(res => {
      setPartners(res.value ?? [])
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/partners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: partners }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function startEdit(i: number) { setEditing(i); setDraft(partners[i]) }
  function commit() {
    if (editing === -1) setPartners(p => [...p, draft])
    else setPartners(p => p.map((x, i) => i === editing ? draft : x))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { setPartners(p => p.filter((_, j) => j !== i)) }
  function move(i: number, dir: -1 | 1) {
    setPartners(p => {
      const next = [...p]
      const tmp = next[i]; next[i] = next[i + dir]; next[i + dir] = tmp
      return next
    })
  }

  function uploadTo(field: 'logo' | 'logoInverted') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = () => setDraft(d => ({ ...d, [field]: reader.result as string }))
      reader.readAsDataURL(file)
    }
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const FIELDS: [keyof Partner, string][] = [
    ['name', 'Partner Name'],
    ['description', 'Short Description'],
    ['url', 'Link (e.g. /partners/datacamp or https://…)'],
  ]

  const renderForm = () => (
    <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {FIELDS.map(([k, label]) => (
          <div key={k} style={k === 'description' ? { gridColumn: '1 / -1' } : undefined}>
            <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>{label}</label>
            <input style={inp} value={(draft[k] ?? '') as string} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {draft.logo
              ? <img src={draft.logo} alt={draft.name} style={{ width: 60, height: 40, objectFit: 'contain', border: '1px solid #d0ccc4', borderRadius: 4, background: '#fff' }} />
              : <div style={{ width: 60, height: 40, borderRadius: 4, background: '#e8e4dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: '#8a9a8f' }}>No logo</div>
            }
            <label style={{ ...s('#1a3c2e'), cursor: 'pointer' }}>
              {draft.logo ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadTo('logo')} />
            </label>
            {draft.logo && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, logo: '' }))}>✕</button>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Inverted Logo (optional, for dark backgrounds)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {draft.logoInverted
              ? <img src={draft.logoInverted} alt={draft.name} style={{ width: 60, height: 40, objectFit: 'contain', border: '1px solid #d0ccc4', borderRadius: 4, background: '#1a3c2e' }} />
              : <div style={{ width: 60, height: 40, borderRadius: 4, background: '#e8e4dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: '#8a9a8f' }}>None</div>
            }
            <label style={{ ...s('#1a3c2e'), cursor: 'pointer' }}>
              {draft.logoInverted ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadTo('logoInverted')} />
            </label>
            {draft.logoInverted && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, logoInverted: '' }))}>✕</button>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={s('#1a3c2e')} onClick={commit} disabled={!draft.name || !draft.logo}>{editing === -1 ? 'Add Partner' : 'Save'}</button>
        <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Partners</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: '.85rem', color: '#8a9a8f' }}>
        Manage organizations shown in the &quot;Our Partners&quot; carousel on the /partner page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {partners.map((p, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? renderForm() : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.logo
                    ? <img src={p.logo} alt={p.name} style={{ width: 48, height: 32, objectFit: 'contain', background: '#fff', border: '1px solid #d0ccc4', borderRadius: 4 }} />
                    : <div style={{ width: 48, height: 32, borderRadius: 4, background: '#e8e4dc' }} />
                  }
                  <div>
                    <strong style={{ fontSize: '.9rem' }}>{p.name}</strong>
                    {p.description && <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{p.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, 1)} disabled={i === partners.length - 1}>↓</button>
                  <button style={s('#1d4ed8')} onClick={() => startEdit(i)}>Edit</button>
                  <button style={s('#dc2626')} onClick={() => remove(i)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editing === -1 ? renderForm() : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Partner</button>
        )}
      </div>

      {partners.length === 0 && editing !== -1 && (
        <p style={{ color: '#8a9a8f', fontSize: '.85rem', marginTop: 12 }}>
          No partners yet. Add one to display it on the public /partner page.
        </p>
      )}
    </div>
  )
}
