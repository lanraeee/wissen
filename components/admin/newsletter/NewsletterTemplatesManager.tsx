'use client'

import { useState, useEffect, useCallback } from 'react'

interface NewsletterTemplate {
  id: string
  name: string
  subject: string
  body: string
  updated_at: string
}

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 10px', border: '1px solid #d0ccc4', borderRadius: 7, fontSize: '.88rem', width: '100%', ...extra,
})
const label = (text: string) => (
  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>{text}</div>
)
const btn = (bg: string, color = '#fff') => ({
  padding: '6px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
})

const EMPTY = { name: '', subject: '', body: '' }

export default function NewsletterTemplatesManager() {
  const [templates, setTemplates] = useState<NewsletterTemplate[] | null>(null)
  const [editing, setEditing] = useState<Partial<NewsletterTemplate> | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/newsletter/templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing) return
    setErr('')
    setBusy(true)
    const isNew = !editing.id
    const res = await fetch(isNew ? '/api/admin/newsletter/templates' : `/api/admin/newsletter/templates/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editing.name, subject: editing.subject, body: editing.body }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      setErr(d?.error ?? 'Could not save template.')
      return
    }
    setEditing(null)
    load()
  }

  async function remove(t: NewsletterTemplate) {
    if (!confirm(`Delete the "${t.name}" template?`)) return
    setBusy(true)
    await fetch(`/api/admin/newsletter/templates/${t.id}`, { method: 'DELETE' })
    setBusy(false)
    load()
  }

  async function runPreview() {
    if (!editing) return
    setPreviewing(true); setErr('')
    try {
      const res = await fetch('/api/admin/newsletter/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editing.subject ?? '', body: editing.body ?? '' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Could not render preview.')
      setPreview(d)
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Could not render preview.')
    } finally {
      setPreviewing(false)
    }
  }

  if (editing) return (
    <div>
      {err && <p style={{ color: '#dc2626', fontSize: '.82rem', marginBottom: 12 }}>{err}</p>}
      <div className="rgrid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 14 }}>
            {label('Template Name')}
            <input style={inp()} value={editing.name ?? ''} onChange={e => setEditing(t => ({ ...t, name: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            {label('Default Subject')}
            <input style={inp()} value={editing.subject ?? ''} onChange={e => setEditing(t => ({ ...t, subject: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            {label('HTML + CSS body (rendered inside the Wissen-Haus email shell)')}
            <textarea
              rows={16}
              style={inp({ fontFamily: 'monospace', fontSize: '.8rem', resize: 'vertical' })}
              value={editing.body ?? ''}
              onChange={e => setEditing(t => ({ ...t, body: e.target.value }))}
              spellCheck={false}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={runPreview} disabled={previewing} style={btn('#1d4ed8')}>{previewing ? 'Rendering…' : 'Preview'}</button>
            <button onClick={save} disabled={busy || !editing.name} style={btn('#1a3c2e')}>Save Template</button>
            <button onClick={() => setEditing(null)} disabled={busy} style={btn('#e8e4dc', '#3a4a3f')}>Cancel</button>
          </div>
        </div>

        <div>
          {label('Preview')}
          {preview ? (
            <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0ece4', fontSize: '.82rem', color: '#3a4a3f' }}>
                <strong>Subject:</strong> {preview.subject}
              </div>
              <iframe title="Template preview" srcDoc={preview.html} sandbox="" style={{ width: '100%', height: 520, border: 'none' }} />
            </div>
          ) : (
            <div style={{ background: '#f9f7f3', borderRadius: 10, padding: 40, textAlign: 'center', color: '#8a9a8f', fontSize: '.85rem' }}>
              Click Preview to see this template rendered in the email shell.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <p style={{ fontSize: '.85rem', color: '#8a9a8f', marginBottom: 16, maxWidth: 640 }}>
        Reusable starting points for a newsletter campaign. Create one here, then copy its subject and body into a new campaign in the Campaigns tab.
      </p>
      <button onClick={() => { setEditing(EMPTY); setPreview(null) }} style={{ ...btn('#1a3c2e'), marginBottom: 16 }}>New Template</button>

      <div className="rgrid-2" style={{ gap: 14 }}>
        {templates === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f', gridColumn: '1/-1' }}>Loading…</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f', gridColumn: '1/-1' }}>No templates yet.</div>
        ) : templates.map(t => (
          <div key={t.id} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', padding: 16 }}>
            <div style={{ fontWeight: 700, color: '#1a2e24', marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: '.8rem', color: '#8a9a8f', marginBottom: 8 }}>{t.subject || <em>No subject set</em>}</div>
            <div style={{ fontSize: '.82rem', color: '#3a4a3f', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'hidden', marginBottom: 12 }}>{t.body || <em>Empty</em>}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setEditing(t); setPreview(null) }} style={btn('#e8e4dc', '#3a4a3f')}>Edit</button>
              <button onClick={() => remove(t)} style={btn('#dc2626')}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
