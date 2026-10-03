'use client'

import { useCallback, useEffect, useState } from 'react'
import { POLICY_DEFAULTS } from '@/lib/policy-doc-defaults'
import { MAX_BODY, MAX_SECTIONS, MAX_TITLE, coerceSections, policyContentKey, withIds, type PolicySection } from '@/lib/policy-doc'

const lbl = { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#8a9a8f', display: 'block', marginBottom: 4 }
const mini = { padding: '4px 10px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, background: '#fff', color: '#3a4a3f', border: '1px solid #e8e4dc', cursor: 'pointer' } as const

/** Editable numbered sections of a long policy page. Numbering and the contents list are automatic. */
export default function PolicySectionsEditor({ slug }: { slug: string }) {
  const builtIn = withIds(POLICY_DEFAULTS[slug] ?? [])
  const [sections, setSections] = useState<PolicySection[]>(builtIn)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${policyContentKey(slug)}`)
      const data = await res.json()
      setSections(coerceSections(data.value) ?? withIds(POLICY_DEFAULTS[slug] ?? []))
    } catch {
      setError('Could not load the sections.')
    }
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  const patch = (i: number, p: Partial<PolicySection>) => setSections(s => s.map((x, k) => (k === i ? { ...x, ...p } : x)))
  const move = (i: number, d: number) => setSections(s => {
    const j = i + d
    if (j < 0 || j >= s.length) return s
    const c = [...s];[c[i], c[j]] = [c[j], c[i]]
    return c
  })

  async function put(value: unknown, msg: string) {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/content/${policyContentKey(slug)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed — your changes have not been stored.')
      }
      const d = await res.json().catch(() => ({}))
      setSaved(d?.pending ? 'Sent for approval' : msg); setTimeout(() => setSaved(''), 2500)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
      return false
    } finally { setSaving(false) }
  }

  async function save() {
    if (sections.some(s => !s.title.trim())) { setError('Every section needs a title.'); return }
    const next = withIds(sections)
    if (await put({ sections: next }, 'Sections saved!')) setSections(next)
  }

  async function reset() {
    if (!window.confirm('Discard all saved edits to these sections and go back to the original text?')) return
    if (await put(null, 'Restored original text')) setSections(withIds(POLICY_DEFAULTS[slug] ?? []))
  }

  if (loading) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading sections…</div>

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e8e4dc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Sections ({sections.length})</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>{saved}</span>}
          <button onClick={reset} disabled={saving} style={mini}>Restore original</button>
          <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .6 : 1 }}>
            {saving ? 'Saving…' : 'Save Sections'}
          </button>
        </div>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: '.8rem', color: '#8a9a8f', lineHeight: 1.6 }}>
        Sections are numbered and listed in the contents automatically. In the text: a blank line starts a new paragraph; start lines with <code>- </code> for bullets or <code>1. </code> for a numbered list; <code>**bold**</code>, <code>*italic*</code>, <code>[link text](/page)</code> or <code>[email](mailto:name@example.org)</code>. Layout and styling can&apos;t be changed.
        {slug === 'wiki' && <> Wiki extras: <code>### Sub-heading</code> makes a sub-heading, <code>{'{ref:3}'}</code> adds footnote [3] (matching the References list above), and a line containing only <code>{'{{personnel}}'}</code> inserts the live team table from Content → Team Members.</>}
      </p>
      {error && <div role="alert" style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map((s, i) => (
          <div key={i} style={{ border: '1px solid #e8e4dc', borderRadius: 8, padding: 14, background: '#fdfcf8' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '.9rem', minWidth: 22 }}>{i + 1}.</strong>
              <input aria-label={`Section ${i + 1} title`} className="admin-input" style={{ flex: 1, minWidth: 180 }} maxLength={MAX_TITLE}
                value={s.title} onChange={e => patch(i, { title: e.target.value })} />
              <button type="button" aria-label={`Move section ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)} style={mini}>↑</button>
              <button type="button" aria-label={`Move section ${i + 1} down`} disabled={i === sections.length - 1} onClick={() => move(i, 1)} style={mini}>↓</button>
              <button type="button" aria-label={`Delete section ${i + 1}`} onClick={() => { if (window.confirm(`Delete section “${s.title}”?`)) setSections(x => x.filter((_, k) => k !== i)) }} style={{ ...mini, color: '#dc2626' }}>Delete</button>
            </div>
            <label style={lbl}>Text <span style={{ textTransform: 'none', fontWeight: 400 }}>({s.body.length}/{MAX_BODY})</span></label>
            <textarea aria-label={`Section ${i + 1} text`} className="admin-textarea" style={{ minHeight: 140, width: '100%' }} maxLength={MAX_BODY}
              value={s.body} onChange={e => patch(i, { body: e.target.value })} />
          </div>
        ))}
      </div>

      <button type="button" disabled={sections.length >= MAX_SECTIONS} onClick={() => setSections(s => [...s, { id: '', title: 'New section', body: '' }])} style={{ ...mini, marginTop: 16, padding: '7px 16px' }}>+ Add section</button>
    </div>
  )
}
