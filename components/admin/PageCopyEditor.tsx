'use client'

import { useState, useEffect, useCallback } from 'react'
import { PAGE_COPY_SCHEMAS } from '@/lib/page-copy-schema'
import { siteContentKeyFor } from '@/lib/page-copy-shared'

const lbl = { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#8a9a8f', display: 'block', marginBottom: 4 }

/**
 * One generic editor for every page registered in lib/page-copy-schema.ts.
 * Deliberately does not let an admin add, remove or reorder fields -- each
 * page's schema is fixed in code, so this can only reword a page, never
 * restructure or break it. See lib/page-copy-shared.ts for the full
 * rationale.
 */
export default function PageCopyEditor() {
  const [slug, setSlug] = useState(PAGE_COPY_SCHEMAS[0]?.slug ?? '')
  const schema = PAGE_COPY_SCHEMAS.find(s => s.slug === slug)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (s: typeof schema) => {
    if (!s) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${siteContentKeyFor(s.slug)}`)
      const data = await res.json()
      const saved = (data.value ?? {}) as Record<string, unknown>
      const next: Record<string, string> = {}
      for (const f of s.fields) {
        const v = saved[f.key]
        next[f.key] = typeof v === 'string' && v.trim() ? v : f.default
      }
      setValues(next)
    } catch {
      setError('Could not load this page’s content.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load(schema) }, [slug, load, schema])

  async function save() {
    if (!schema) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${siteContentKeyFor(schema.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed — your changes have not been stored.')
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    }
    setSaving(false)
  }

  if (PAGE_COPY_SCHEMAS.length === 0) {
    return <div style={{ padding: 24, color: '#8a9a8f' }}>No pages are wired to Page Copy yet.</div>
  }

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: '.85rem', color: '#8a9a8f' }}>
        Reword any of these pages&apos; headings and paragraphs. You can only edit text here — the page&apos;s layout, images and links stay exactly as built, so there&apos;s nothing to accidentally break.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {PAGE_COPY_SCHEMAS.map(s => (
          <button key={s.slug} onClick={() => setSlug(s.slug)} style={{
            padding: '6px 14px', borderRadius: 99, fontSize: '.8rem', fontWeight: 600,
            background: slug === s.slug ? '#1a3c2e' : '#fff',
            color: slug === s.slug ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc', cursor: 'pointer',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {loading || !schema ? (
        <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{schema.label}</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
              <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .6 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
          {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {schema.fields.map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.label} <span style={{ textTransform: 'none', fontWeight: 400 }}>({values[f.key]?.length ?? 0}/{f.maxLength})</span></label>
                {f.type === 'textarea' ? (
                  <textarea
                    className="admin-textarea" style={{ minHeight: 90, width: '100%' }}
                    value={values[f.key] ?? ''} maxLength={f.maxLength}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="admin-input" style={{ width: '100%' }}
                    value={values[f.key] ?? ''} maxLength={f.maxLength}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
