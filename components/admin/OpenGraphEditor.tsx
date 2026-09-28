'use client'

import { useState, useEffect, useCallback } from 'react'
import { OG_PAGE_SCHEMAS } from '@/lib/og-schema'
import { ogSiteContentKeyFor, OG_TITLE_MAX, OG_OG_TITLE_MAX, OG_DESCRIPTION_MAX, type OgCopy } from '@/lib/og-shared'

const lbl = { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#8a9a8f', display: 'block', marginBottom: 4 }

/**
 * Edits the <title>/og:title/og:description for one page at a time, chosen
 * from every page registered in lib/og-schema.ts. Deliberately 3 plain-text
 * fields only, each length-capped -- an admin can reword how a page's link
 * looks when shared, never change which image it uses or add markup.
 */
export default function OpenGraphEditor() {
  const [slug, setSlug] = useState(OG_PAGE_SCHEMAS[0]?.slug ?? '')
  const schema = OG_PAGE_SCHEMAS.find(s => s.slug === slug)
  const [values, setValues] = useState<OgCopy>({ title: '', ogTitle: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (s: typeof schema) => {
    if (!s) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${ogSiteContentKeyFor(s.slug)}`)
      const data = await res.json()
      const saved = (data.value ?? {}) as Partial<OgCopy>
      setValues({
        title: (typeof saved.title === 'string' && saved.title.trim()) || s.defaultTitle,
        ogTitle: (typeof saved.ogTitle === 'string' && saved.ogTitle.trim()) || s.defaultOgTitle,
        description: (typeof saved.description === 'string' && saved.description.trim()) || s.defaultDescription,
      })
    } catch {
      setError('Could not load this page’s Open Graph settings.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load(schema) }, [slug, load, schema])

  async function save() {
    if (!schema) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${ogSiteContentKeyFor(schema.slug)}`, {
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

  async function reset() {
    if (!schema) return
    if (!confirm(`Reset "${schema.label}" back to its default title and description?`)) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${ogSiteContentKeyFor(schema.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: {} }),
      })
      if (!res.ok) throw new Error('Reset failed.')
      setValues({ title: schema.defaultTitle, ogTitle: schema.defaultOgTitle, description: schema.defaultDescription })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.')
    }
    setSaving(false)
  }

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: '.85rem', color: '#8a9a8f' }}>
        Control how each page&apos;s tab title and social-share card (Facebook, X, WhatsApp, LinkedIn, iMessage…) read. The share image itself stays the site&apos;s standard card — edit its content (tagline, stats) from Settings → General and Content → Homepage Hero.
      </p>

      <div style={{ marginBottom: 20, maxWidth: 420 }}>
        <label style={lbl}>Page</label>
        <select
          className="admin-input" value={slug} onChange={e => setSlug(e.target.value)}
          style={{ width: '100%' }}
        >
          {OG_PAGE_SCHEMAS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
        </select>
      </div>

      {loading || !schema ? (
        <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
            <button onClick={reset} disabled={saving} style={{ padding: '7px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#f0ece4', color: '#3a4a3f', border: 'none', cursor: 'pointer', opacity: saving ? .6 : 1 }}>
              Reset to Default
            </button>
            <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .6 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
          {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

          <div className="rgrid-2" style={{ gap: 16, marginBottom: 24 }}>
            <div>
              <label style={lbl}>Browser Tab Title <span style={{ textTransform: 'none', fontWeight: 400 }}>({values.title.length}/{OG_TITLE_MAX})</span></label>
              <input
                className="admin-input" style={{ width: '100%' }}
                value={values.title} maxLength={OG_TITLE_MAX}
                onChange={e => setValues(v => ({ ...v, title: e.target.value }))}
              />
            </div>
            <div>
              <label style={lbl}>Social Share Title <span style={{ textTransform: 'none', fontWeight: 400 }}>({values.ogTitle.length}/{OG_OG_TITLE_MAX})</span></label>
              <input
                className="admin-input" style={{ width: '100%' }}
                value={values.ogTitle} maxLength={OG_OG_TITLE_MAX}
                onChange={e => setValues(v => ({ ...v, ogTitle: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Social Share Description <span style={{ textTransform: 'none', fontWeight: 400 }}>({values.description.length}/{OG_DESCRIPTION_MAX})</span></label>
              <textarea
                className="admin-textarea" style={{ minHeight: 80, width: '100%' }}
                value={values.description} maxLength={OG_DESCRIPTION_MAX}
                onChange={e => setValues(v => ({ ...v, description: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 8 }}>Preview</div>
          <div style={{ border: '1px solid #e8e4dc', borderRadius: 10, overflow: 'hidden', maxWidth: 420 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/opengraph-image" alt="" style={{ width: '100%', display: 'block', aspectRatio: '1200/630', objectFit: 'cover', background: '#f0ece4' }} />
            <div style={{ padding: '10px 12px', background: '#f7f5f0' }}>
              <div style={{ fontSize: '.68rem', color: '#8a9a8f', textTransform: 'uppercase', letterSpacing: '.04em' }}>wissenhaus.org</div>
              <div style={{ fontSize: '.86rem', fontWeight: 700, color: '#1a2e24', marginTop: 2 }}>{values.ogTitle || schema.defaultOgTitle}</div>
              <div style={{ fontSize: '.78rem', color: '#5a5a4a', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {values.description || schema.defaultDescription}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
