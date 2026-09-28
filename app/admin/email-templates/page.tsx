'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface EmailTemplateInfo {
  id: string
  name: string
  category: string
  recipient: 'User' | 'Admin'
  variables: string[]
  defaultSubject: string
  defaultBody: string
  trigger: string
  source: string
}

interface Override { subject: string; html: string; updated_at: string }

const CATEGORY_COLORS: Record<string, string> = {
  'Account & Security': '#1a3c2e',
  'Donations': '#B8952A',
  'Career Fair': '#1d4ed8',
  'Courses & Certificates': '#7c3aed',
  'User Confirmations': '#0891b2',
  'Admin Notifications': '#b45309',
}

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '8px 10px', border: '1px solid #d0ccc4', borderRadius: 7, fontSize: '.88rem', width: '100%', boxSizing: 'border-box', ...extra,
})
const label = (text: string) => (
  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>{text}</div>
)
const btn = (bg: string, color = '#fff') => ({
  padding: '7px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
})

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplateInfo[] | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [overrides, setOverrides] = useState<Record<string, Override>>({})
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ subject: string; html: string }>({ subject: '', html: '' })
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const htmlRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/email-templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setCategories(data.categories ?? [])
    setOverrides(data.overrides ?? {})
  }, [])

  useEffect(() => { load() }, [load])

  const editingTemplate = templates?.find(t => t.id === editingId) ?? null

  function startEdit(t: EmailTemplateInfo) {
    const o = overrides[t.id]
    setDraft({ subject: o?.subject ?? t.defaultSubject, html: o?.html ?? t.defaultBody })
    setEditingId(t.id)
    setPreview(null)
    setError('')
  }

  function insertVariable(name: string) {
    const el = htmlRef.current
    const token = `{{${name}}}`
    if (!el) { setDraft(d => ({ ...d, html: d.html + token })); return }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + token + el.value.slice(end)
    setDraft(d => ({ ...d, html: next }))
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + token.length })
  }

  async function runPreview() {
    if (!editingId) return
    setPreviewing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/email-templates/${editingId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Could not render preview.')
      setPreview(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not render preview.')
    } finally {
      setPreviewing(false)
    }
  }

  async function save() {
    if (!editingId) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/email-templates/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed.')
      }
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function resetToDefault() {
    if (!editingId || !confirm('Reset this template to its built-in default? Your customization will be lost.')) return
    setSaving(true)
    await fetch(`/api/admin/email-templates/${editingId}`, { method: 'DELETE' })
    setSaving(false)
    setEditingId(null)
    load()
  }

  if (editingTemplate) return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">{editingTemplate.name}</h1>
          <p className="admin-page-desc">{editingTemplate.trigger}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {overrides[editingTemplate.id] && <button style={btn('#e8e4dc', '#3a4a3f')} onClick={resetToDefault} disabled={saving}>Reset to Default</button>}
          <button style={btn('#e8e4dc', '#3a4a3f')} onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
          <button style={btn('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div className="rgrid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 14 }}>
            {label('Subject')}
            <input style={inp()} value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} />
          </div>

          <div style={{ marginBottom: 8 }}>
            {label('Available variables (click to insert)')}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {editingTemplate.variables.map(v => (
                <button key={v} onClick={() => insertVariable(v)} style={{
                  padding: '3px 9px', borderRadius: 6, fontSize: '.74rem', fontFamily: 'monospace',
                  background: '#f0ece4', color: '#3a4a3f', border: '1px solid #d0ccc4', cursor: 'pointer',
                }}>{`{{${v}}}`}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            {label('HTML + CSS body (rendered inside the Wissen-Haus email shell)')}
            <textarea
              ref={htmlRef}
              rows={22}
              style={inp({ fontFamily: 'monospace', fontSize: '.8rem', resize: 'vertical' })}
              value={draft.html}
              onChange={e => setDraft(d => ({ ...d, html: e.target.value }))}
              spellCheck={false}
            />
          </div>

          <button style={btn('#1d4ed8')} onClick={runPreview} disabled={previewing}>{previewing ? 'Rendering…' : 'Preview'}</button>
        </div>

        <div>
          {label('Preview')}
          {preview ? (
            <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0ece4', fontSize: '.82rem', color: '#3a4a3f' }}>
                <strong>Subject:</strong> {preview.subject}
              </div>
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                sandbox=""
                style={{ width: '100%', height: 640, border: 'none' }}
              />
            </div>
          ) : (
            <div style={{ background: '#f9f7f3', borderRadius: 10, padding: 40, textAlign: 'center', color: '#8a9a8f', fontSize: '.85rem' }}>
              Click Preview to see this template rendered with sample data.
            </div>
          )}
        </div>
      </div>
    </>
  )

  const filtered = (templates ?? []).filter(t => !filter || t.category === filter)

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Email Templates</h1>
        <p className="admin-page-desc">
          Every transactional email the site sends — what it&apos;s called, who receives it, what triggers it, and its subject and HTML+CSS content, all editable here.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '5px 12px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: '1px solid #d0ccc4', cursor: 'pointer',
            background: filter === '' ? '#1a3c2e' : '#fff', color: filter === '' ? '#fff' : '#3a4a3f',
          }}
        >
          All ({templates?.length ?? 0})
        </button>
        {categories.map(c => {
          const count = (templates ?? []).filter(t => t.category === c).length
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: '1px solid #d0ccc4', cursor: 'pointer',
                background: filter === c ? (CATEGORY_COLORS[c] ?? '#1a3c2e') : '#fff', color: filter === c ? '#fff' : '#3a4a3f',
              }}
            >
              {c} ({count})
            </button>
          )
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto' }}>
        {templates === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No templates in this category.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['Template', 'Category', 'To', 'Subject', 'Trigger', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const customized = !!overrides[t.id]
                return (
                  <tr key={t.id}>
                    <td style={{ padding: '10px 16px', fontSize: '.85rem', fontWeight: 600, color: '#1a2e24' }}>{t.name}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: (CATEGORY_COLORS[t.category] ?? '#6b7280') + '22', color: CATEGORY_COLORS[t.category] ?? '#6b7280', borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f' }}>{t.recipient}</td>
                    <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#3a4a3f', fontFamily: 'monospace', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={overrides[t.id]?.subject ?? t.defaultSubject}>
                      {overrides[t.id]?.subject ?? t.defaultSubject}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#3a4a3f', maxWidth: 280 }}>{t.trigger}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {customized ? (
                        <span style={{ background: '#1a3c2e22', color: '#1a3c2e', borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700 }}>Customized</span>
                      ) : (
                        <span style={{ color: '#8a9a8f', fontSize: '.78rem' }}>Default</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button style={btn('#e8e4dc', '#3a4a3f')} onClick={() => startEdit(t)}>Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
