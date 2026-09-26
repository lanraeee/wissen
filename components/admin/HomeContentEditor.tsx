'use client'

import { useState, useEffect } from 'react'

interface HeroContent {
  eyebrow: string
  headlineLine1: string
  headlineLine2: string
  lead: string
  ctaText: string
  ctaHref: string
  image?: string
}

interface StatItem {
  count: string
  suffix: string
  label: string
}

const DEFAULT_HERO: HeroContent = {
  eyebrow: 'Ibadan, Nigeria · Est. 2025',
  headlineLine1: 'Your Roadmap to',
  headlineLine2: 'Opportunity Starts Here.',
  lead: "Confused about what's next? Don't know where to start? We've built resources that help you discover careers that match your interests, understand what it takes to succeed, and connect with people doing the work you're curious about.",
  ctaText: 'Take the Career Assessment',
  ctaHref: '/career-pathways',
  image: '',
}

const BLANK_HERO: HeroContent = { eyebrow: '', headlineLine1: '', headlineLine2: '', lead: '', ctaText: '', ctaHref: '', image: '' }

const DEFAULT_STATS: StatItem[] = [
  { count: '500', suffix: '+', label: 'Students Reached' },
  { count: '30', suffix: '+', label: 'Mentors Involved' },
  { count: '15', suffix: '+', label: 'School Partnerships' },
  { count: '1', suffix: '', label: 'Year Since Launch' },
]

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const fieldLabel = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em' }

const HERO_FIELDS: [keyof HeroContent, string, string?][] = [
  ['eyebrow', 'Eyebrow (small text above headline)'],
  ['headlineLine1', 'Headline — Line 1'],
  ['headlineLine2', 'Headline — Line 2'],
  ['ctaText', 'Button Text'],
  ['ctaHref', 'Button Link'],
  ['image', 'Image path (optional)', '/img/prog-bootcamp.jpg — leave blank for the default hero photo'],
]

export default function HomeContentEditor() {
  const [heroes, setHeroes] = useState<HeroContent[]>([DEFAULT_HERO])
  const [stats, setStats] = useState<StatItem[]>(DEFAULT_STATS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editingHero, setEditingHero] = useState<number | null>(null)
  const [heroDraft, setHeroDraft] = useState<HeroContent>(BLANK_HERO)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/homepage_hero_slides').then(r => r.json()),
      fetch('/api/admin/content/homepage_hero').then(r => r.json()),
      fetch('/api/admin/content/homepage_stats').then(r => r.json()),
    ]).then(([slidesRes, legacyRes, statsRes]) => {
      const slides: HeroContent[] = Array.isArray(slidesRes.value) && slidesRes.value.length > 0
        ? slidesRes.value
        : [legacyRes.value ? { ...DEFAULT_HERO, ...legacyRes.value } : DEFAULT_HERO]
      setHeroes(slides)
      setStats(Array.isArray(statsRes.value) && statsRes.value.length === 4 ? statsRes.value : DEFAULT_STATS)
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const [heroRes, statsRes] = await Promise.all([
        fetch('/api/admin/content/homepage_hero_slides', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: heroes }),
        }),
        fetch('/api/admin/content/homepage_stats', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: stats }),
        }),
      ])
      if (!heroRes.ok || !statsRes.ok) {
        const failed = !heroRes.ok ? await heroRes.json().catch(() => ({})) : await statsRes.json().catch(() => ({}))
        throw new Error(failed?.error || 'Save failed — your changes have not been stored.')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function setStat(i: number, patch: Partial<StatItem>) {
    setStats(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  function startEditHero(i: number) { setEditingHero(i); setHeroDraft(heroes[i]) }
  function startNewHero() { setEditingHero(-1); setHeroDraft(BLANK_HERO) }
  function commitHero() {
    if (editingHero === -1) setHeroes(h => [...h, heroDraft])
    else setHeroes(h => h.map((x, i) => i === editingHero ? heroDraft : x))
    setEditingHero(null); setHeroDraft(BLANK_HERO)
  }
  function removeHero(i: number) {
    if (heroes.length <= 1) { alert('At least one hero slide is required.'); return }
    setHeroes(h => h.filter((_, j) => j !== i))
  }
  function moveHero(i: number, dir: -1 | 1) {
    setHeroes(h => {
      const next = [...h]
      const tmp = next[i]; next[i] = next[i + dir]; next[i + dir] = tmp
      return next
    })
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const heroForm = (
    <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="rgrid-2" style={{ gap: 10 }}>
        {HERO_FIELDS.map(([k, label, placeholder]) => (
          <div key={k}>
            <label style={fieldLabel}>{label}</label>
            <input className="admin-input" placeholder={placeholder} value={heroDraft[k] ?? ''} onChange={e => setHeroDraft(h => ({ ...h, [k]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div>
        <label style={fieldLabel}>Lead Paragraph</label>
        <textarea className="admin-textarea" style={{ minHeight: 80 }} value={heroDraft.lead} onChange={e => setHeroDraft(h => ({ ...h, lead: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={s('#1a3c2e')} onClick={commitHero}>{editingHero === -1 ? 'Add Slide' : 'Save Slide'}</button>
        <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setEditingHero(null); setHeroDraft(BLANK_HERO) }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Homepage Hero &amp; Stats</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <h3 style={{ margin: '0 0 4px', fontSize: '.95rem', color: '#1a3c2e' }}>Hero Slides</h3>
      <p style={{ margin: '0 0 12px', fontSize: '.82rem', color: '#8a9a8f' }}>
        More than one slide turns the homepage hero into a rotating slider (auto-advances every 8s, with dots to jump between slides). One slide shows a static hero, same as before.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {heroes.map((hero, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px' }}>
            {editingHero === i ? heroForm : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: '.9rem' }}>{hero.headlineLine1} {hero.headlineLine2}</strong>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f', marginTop: 2 }}>{hero.eyebrow}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => moveHero(i, -1)} disabled={i === 0}>↑</button>
                  <button style={{ ...s('#e8e4dc', '#3a4a3f'), padding: '4px 8px' }} onClick={() => moveHero(i, 1)} disabled={i === heroes.length - 1}>↓</button>
                  <button style={s('#1d4ed8')} onClick={() => startEditHero(i)}>Edit</button>
                  <button style={s('#dc2626')} onClick={() => removeHero(i)}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editingHero === -1 ? heroForm : (
          <button style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }} onClick={startNewHero}>+ Add Hero Slide</button>
        )}
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', color: '#1a3c2e' }}>Stat Numbers</h3>
      <p style={{ margin: '0 0 12px', fontSize: '.82rem', color: '#8a9a8f' }}>
        Shared across every hero slide. The first and third stats also appear as floating badges over the hero image.
      </p>
      <div className="rgrid-2" style={{ gap: 10 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="rgrid-2" style={{ gap: 8 }}>
              <div>
                <label style={fieldLabel}>Number</label>
                <input className="admin-input" value={stat.count} onChange={e => setStat(i, { count: e.target.value })} />
              </div>
              <div>
                <label style={fieldLabel}>Suffix</label>
                <input className="admin-input" value={stat.suffix} onChange={e => setStat(i, { suffix: e.target.value })} placeholder="+ or blank" />
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Label</label>
              <input className="admin-input" value={stat.label} onChange={e => setStat(i, { label: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
