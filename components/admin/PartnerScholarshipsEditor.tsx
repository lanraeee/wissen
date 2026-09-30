'use client'

import { useState, useEffect } from 'react'
import { resizeImageToDataUrl } from '@/lib/resizeImageClient'
import { DEFAULT_PARTNER_SCHOLARSHIPS, type PartnerScholarship } from '@/lib/partner-scholarships'

const BLANK: PartnerScholarship = { name: '', logo: '', description: '', infoHref: '', applyHref: '', applyLabel: 'Apply for a Scholarship' }

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const lbl = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em' }

export default function PartnerScholarshipsEditor() {
  const [items, setItems] = useState<PartnerScholarship[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<PartnerScholarship>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/partner_scholarships').then(r => r.json()).then(res => {
      setItems(Array.isArray(res.value) ? res.value : [])
      setLoaded(true)
    })
  }, [])

  async function save(next?: PartnerScholarship[]) {
    const payload = next ?? items
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/content/partner_scholarships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: payload }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed — your changes have not been stored. A logo may be too large.')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(i: number) { setEditing(i); setDraft(items[i]) }
  function commit() {
    if (editing === -1) setItems(p => [...p, draft])
    else setItems(p => p.map((x, i) => i === editing ? draft : x))
    setEditing(null); setDraft(BLANK)
  }
  function remove(i: number) { setItems(p => p.filter((_, j) => j !== i)) }
  function move(i: number, dir: -1 | 1) {
    setItems(p => {
      const next = [...p]
      const tmp = next[i]; next[i] = next[i + dir]; next[i + dir] = tmp
      return next
    })
  }

  function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    resizeImageToDataUrl(file, 400, 'image/png').then(
      dataUrl => setDraft(d => ({ ...d, logo: dataUrl })),
      err => setError(err instanceof Error ? err.message : 'Could not process the image.')
    )
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const FIELDS: [keyof PartnerScholarship, string, string][] = [
    ['name', 'Partner / Programme Name', 'e.g. DataCamp Donates'],
    ['description', 'Short Description', 'What the scholarship gives a student'],
    ['infoHref', 'Info Page Link', '/partners/datacamp — public, anyone can read it'],
    ['applyHref', 'Application Form Link', '/partners/datacamp/apply — members-only, prompts sign-in'],
    ['applyLabel', 'Apply Button Text', 'Apply for a Scholarship'],
  ]

  const renderForm = () => (
    <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="rgrid-2" style={{ gap: 8 }}>
        {FIELDS.map(([k, label, hint]) => (
          <div key={k} style={k === 'description' ? { gridColumn: '1 / -1' } : undefined}>
            <label style={lbl}>{label}</label>
            <input className="admin-input" style={{ width: '100%' }} value={draft[k] ?? ''} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} />
            <p style={{ margin: '2px 0 0', fontSize: '.7rem', color: '#8a9a8f' }}>{hint}</p>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={lbl}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {draft.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={draft.logo} alt={draft.name} style={{ width: 60, height: 40, objectFit: 'contain', border: '1px solid #d0ccc4', borderRadius: 4, background: '#fff' }} />
              : <div style={{ width: 60, height: 40, borderRadius: 4, background: '#e8e4dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: '#8a9a8f' }}>No logo</div>
            }
            <label style={{ ...s('#1a3c2e'), cursor: 'pointer' }}>
              {draft.logo ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
            </label>
            {draft.logo && <button style={s('#dc2626')} onClick={() => setDraft(d => ({ ...d, logo: '' }))}>✕</button>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={s('#1a3c2e')} onClick={commit} disabled={!draft.name || !draft.description}>{editing === -1 ? 'Add Scholarship' : 'Save'}</button>
        <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditing(null); setDraft(BLANK) }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Partner Scholarships</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={() => save()} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <p style={{ margin: '0 0 16px', fontSize: '.85rem', color: '#8a9a8f' }}>
        Scholarships offered through our own partnerships — shown on the &quot;Wissen-Haus Partners&quot; tab at
        {' '}<a href="/community?tab=wissenhaus-partners#opportunities" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e', fontWeight: 600 }}>the Community Hub</a>.
        Info pages stay public so anyone can read about the partnership; application forms under
        {' '}<code style={{ background: '#f0ece4', padding: '1px 5px', borderRadius: 4 }}>/partners/…/apply</code> require a Wissen-Haus account.
        Links can also point to an external site if a partner runs their own form.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((p, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editing === i ? renderForm() : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.logo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.logo} alt={p.name} style={{ width: 48, height: 32, objectFit: 'contain', background: '#fff', border: '1px solid #d0ccc4', borderRadius: 4 }} />
                    : <div style={{ width: 48, height: 32, borderRadius: 4, background: '#e8e4dc' }} />
                  }
                  <div>
                    <strong style={{ fontSize: '.9rem' }}>{p.name}</strong>
                    {p.description && <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{p.description.slice(0, 90)}{p.description.length > 90 ? '…' : ''}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
                  <button style={s('#1d4ed8')} onClick={() => startEdit(i)}>Edit</button>
                  <button style={s('#dc2626')} onClick={() => remove(i)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editing === -1 ? renderForm() : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={() => { setEditing(-1); setDraft(BLANK) }}>+ Add Scholarship</button>
        )}
      </div>

      {items.length === 0 && editing !== -1 && (
        <p style={{ color: '#8a9a8f', fontSize: '.85rem', marginTop: 12 }}>
          Nothing saved yet, so the page is showing the built-in default ({DEFAULT_PARTNER_SCHOLARSHIPS.map(d => d.name).join(', ')}).
          Add an entry here to take over — once you save a list, it replaces the default entirely.
        </p>
      )}
    </div>
  )
}
