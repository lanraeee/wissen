'use client'

import { useState, useEffect } from 'react'

interface HeroContent {
  eyebrow: string
  headlineLine1: string
  headlineLine2: string
  lead: string
  ctaText: string
  ctaHref: string
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
}

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

export default function HomeContentEditor() {
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO)
  const [stats, setStats] = useState<StatItem[]>(DEFAULT_STATS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/homepage_hero').then(r => r.json()),
      fetch('/api/admin/content/homepage_stats').then(r => r.json()),
    ]).then(([heroRes, statsRes]) => {
      setHero({ ...DEFAULT_HERO, ...(heroRes.value ?? {}) })
      setStats(Array.isArray(statsRes.value) && statsRes.value.length === 4 ? statsRes.value : DEFAULT_STATS)
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const [heroRes, statsRes] = await Promise.all([
        fetch('/api/admin/content/homepage_hero', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: hero }),
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

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const HERO_FIELDS: [keyof HeroContent, string][] = [
    ['eyebrow', 'Eyebrow (small text above headline)'],
    ['headlineLine1', 'Headline — Line 1'],
    ['headlineLine2', 'Headline — Line 2'],
    ['ctaText', 'Button Text'],
    ['ctaHref', 'Button Link'],
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Homepage Hero &amp; Stats</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {HERO_FIELDS.map(([k, label]) => (
            <div key={k}>
              <label style={fieldLabel}>{label}</label>
              <input className="admin-input" value={hero[k]} onChange={e => setHero(h => ({ ...h, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div>
          <label style={fieldLabel}>Lead Paragraph</label>
          <textarea className="admin-textarea" style={{ minHeight: 80 }} value={hero.lead} onChange={e => setHero(h => ({ ...h, lead: e.target.value }))} />
        </div>
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', color: '#1a3c2e' }}>Stat Numbers</h3>
      <p style={{ margin: '0 0 12px', fontSize: '.82rem', color: '#8a9a8f' }}>
        The first and third stats also appear as floating badges over the hero image.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
