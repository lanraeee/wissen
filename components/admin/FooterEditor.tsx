'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FOOTER_DEFAULTS,
  FOOTER_LIMITS,
  FOOTER_CONTENT_KEY,
  isSafeFooterHref,
  normalizeFooterContent,
  type FooterContent,
  type FooterLink,
} from '@/lib/footer-content-shared'

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const inpBad = { ...inp, border: '1px solid #dc2626', background: '#fef2f2' }
const lbl = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em', display: 'block', marginBottom: 3 }
const hint = { fontSize: '.72rem', color: '#8a9a8f', marginTop: 4 }
const btn = (bg: string, color = '#fff') => ({ padding: '5px 10px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)
const card = { background: '#f9f7f3', borderRadius: 8, padding: '16px', marginBottom: 20 }

// Same rule the public footer applies (lib/footer-content-shared): a link
// needs a label and a safe href. The editor flags problems before saving.
function linkProblem(link: FooterLink): string | null {
  if (!link.label.trim()) return 'Label is needed.'
  if (!link.href.trim()) return 'Link is needed.'
  if (!isSafeFooterHref(link.href)) return 'Use a site path (/about), an anchor (#x), https://, mailto: or tel:.'
  return null
}

function LinkList({ links, onChange, max, title }: {
  links: FooterLink[]
  onChange: (next: FooterLink[]) => void
  max: number
  title: string
}) {
  function update(i: number, patch: Partial<FooterLink>) {
    onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= links.length) return
    const next = [...links]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  function remove(i: number) { onChange(links.filter((_, j) => j !== i)) }
  function add() { onChange([...links, { label: '', href: '/' }]) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {links.length === 0 && <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>No links in {title}.</p>}
      {links.map((link, i) => {
        const problem = linkProblem(link)
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1fr) minmax(160px,1.4fr) auto', gap: 6, alignItems: 'start' }}>
            <div>
              <input aria-label={`${title} link ${i + 1} label`} style={inp} placeholder="Label" maxLength={FOOTER_LIMITS.label}
                value={link.label} onChange={e => update(i, { label: e.target.value })} />
            </div>
            <div>
              <input aria-label={`${title} link ${i + 1} address`} style={problem && link.href.trim() ? inpBad : inp} placeholder="/programmes or https://…" maxLength={FOOTER_LIMITS.href}
                value={link.href} onChange={e => update(i, { href: e.target.value })} />
              {problem && <div style={{ ...hint, color: '#dc2626' }}>{problem}</div>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" style={btn('#e8e4dc', '#3a4a3f')} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" style={btn('#e8e4dc', '#3a4a3f')} onClick={() => move(i, 1)} disabled={i === links.length - 1} aria-label="Move down">↓</button>
              <button type="button" style={btn('#dc2626')} onClick={() => remove(i)} aria-label="Remove link">✕</button>
            </div>
          </div>
        )
      })}
      <div>
        <button type="button" style={btn('#1a3c2e')} onClick={add} disabled={links.length >= max}>+ Add link</button>
        {links.length >= max && <span style={{ ...hint, marginLeft: 8 }}>Limit of {max} links reached.</span>}
      </div>
    </div>
  )
}

export default function FooterEditor() {
  const [content, setContent] = useState<FooterContent>(FOOTER_DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<'' | 'saved' | 'pending'>('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/content/${FOOTER_CONTENT_KEY}`)
      .then(r => r.json())
      .then(res => setContent(normalizeFooterContent(res.value)))
      .catch(() => setError('Could not load the footer. Showing the built-in defaults.'))
      .finally(() => setLoaded(true))
  }, [])

  const invalid = [...content.columns.flatMap(c => c.links), ...content.bottomLinks]
    .some(l => linkProblem(l) !== null)
  const emptyColumnTitle = content.columns.some(c => !c.title.trim()) || !content.contactTitle.trim()

  function setColumn(i: number, patch: Partial<FooterContent['columns'][number]>) {
    setContent(c => {
      const columns = [...c.columns] as FooterContent['columns']
      columns[i] = { ...columns[i], ...patch }
      return { ...c, columns }
    })
  }

  async function save() {
    setSaving(true); setError(''); setSaved('')
    try {
      const res = await fetch(`/api/admin/content/${FOOTER_CONTENT_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: content }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Save failed. Your changes have not been stored.')
      setSaved(data?.pending ? 'pending' : 'saved')
      setTimeout(() => setSaved(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Footer</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved === 'saved' && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved! The footer updates on the next page load.</span>}
          {saved === 'pending' && <span style={{ fontSize: '.8rem', color: '#b45309' }}>Sent for director approval.</span>}
          <button type="button" onClick={save} disabled={saving || invalid || emptyColumnTitle}
            style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#f4f0e7', border: 'none', cursor: 'pointer', opacity: (saving || invalid || emptyColumnTitle) ? 0.5 : 1 }}>
            {saving ? 'Saving…' : 'Save Footer'}
          </button>
        </div>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: '.85rem', color: '#6b7a70' }}>
        Everything in the site footer except the address, phone numbers and social links. Those come from{' '}
        <Link href="/admin/content?tab=contact" style={{ color: '#1a3c2e', fontWeight: 600 }}>Contact Details</Link>, so emails and the contact page stay in step.
      </p>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}
      {invalid && <div style={{ marginBottom: 16, color: '#b45309', fontSize: '.85rem', background: '#fef3c7', padding: '8px 14px', borderRadius: 7 }}>Fix the highlighted links before saving.</div>}

      {/* Brand */}
      <div style={card}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Brand text</div>
        <label style={lbl}>Description under the logo</label>
        <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} maxLength={FOOTER_LIMITS.description}
          value={content.description} onChange={e => setContent(c => ({ ...c, description: e.target.value }))} />
        <div style={hint}>{content.description.length}/{FOOTER_LIMITS.description}</div>
      </div>

      {/* Link columns */}
      {content.columns.map((col, i) => (
        <div key={i} style={card}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Link column {i + 1}</div>
          <label style={lbl}>Column heading</label>
          <input style={{ ...inp, marginBottom: 12 }} maxLength={FOOTER_LIMITS.title} value={col.title}
            onChange={e => setColumn(i, { title: e.target.value })} />
          <LinkList title={col.title || `column ${i + 1}`} links={col.links} max={FOOTER_LIMITS.linksPerColumn}
            onChange={links => setColumn(i, { links })} />
        </div>
      ))}

      {/* Contact column */}
      <div style={card}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Contact column</div>
        <div className="rgrid-2" style={{ gap: 10 }}>
          <div>
            <label style={lbl}>Heading</label>
            <input style={inp} maxLength={FOOTER_LIMITS.title} value={content.contactTitle}
              onChange={e => setContent(c => ({ ...c, contactTitle: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>First link label</label>
            <input style={inp} maxLength={FOOTER_LIMITS.label} value={content.contactLinkLabel}
              onChange={e => setContent(c => ({ ...c, contactLinkLabel: e.target.value }))} />
            <div style={hint}>This link goes to the contact page.</div>
          </div>
        </div>
        <div style={{ ...hint, marginTop: 10 }}>
          Address, phone numbers and the flag lines are shown from Contact Details. Edit them there.
        </div>
      </div>

      {/* Bottom bar */}
      <div style={card}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Bottom bar</div>
        <div className="rgrid-2" style={{ gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Copyright line</label>
            <input style={inp} maxLength={FOOTER_LIMITS.copyright} value={content.copyright}
              onChange={e => setContent(c => ({ ...c, copyright: e.target.value }))} />
            <div style={hint}>Use {'{year}'} for the current year.</div>
          </div>
          <div>
            <label style={lbl}>Tagline (optional)</label>
            <input style={inp} maxLength={FOOTER_LIMITS.tagline} value={content.tagline} placeholder="Leave blank to use the Contact Details tagline"
              onChange={e => setContent(c => ({ ...c, tagline: e.target.value }))} />
          </div>
        </div>
        <label style={lbl}>Legal and policy links</label>
        <LinkList title="the bottom bar" links={content.bottomLinks} max={FOOTER_LIMITS.bottomLinks}
          onChange={bottomLinks => setContent(c => ({ ...c, bottomLinks }))} />
      </div>

      {/* Watermark */}
      <div style={card}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Large watermark text</div>
        <input style={inp} maxLength={FOOTER_LIMITS.watermark} value={content.watermark}
          onChange={e => setContent(c => ({ ...c, watermark: e.target.value }))} />
        <div style={hint}>The faded word behind the bottom of the footer.</div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
        <button type="button" onClick={() => { setContent(FOOTER_DEFAULTS); setError('') }}
          style={{ ...btn('#e8e4dc', '#3a4a3f'), padding: '7px 14px', fontSize: '.8rem' }}>
          Reset to built-in defaults
        </button>
        <span style={{ fontSize: '.75rem', color: '#8a9a8f' }}>Reset only changes this form. Nothing is saved until you press Save Footer.</span>
      </div>
    </div>
  )
}
