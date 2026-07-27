'use client'

import { useState, useEffect } from 'react'

interface Settings {
  contact_email: string
  whatsapp_url: string
  instagram_url: string
  linkedin_url: string
  twitter_url: string
  tagline: string
  footer_note: string
  loader_enabled: boolean
}

const DEFAULTS: Settings = {
  contact_email: 'info@wissenhaus.org',
  whatsapp_url: 'https://chat.whatsapp.com/wissenhaus',
  instagram_url: '',
  linkedin_url: '',
  twitter_url: '',
  tagline: 'Building the bridge young Nigerians deserve.',
  footer_note: '',
  loader_enabled: true,
}

const inp = { padding: '8px 12px', fontSize: '.88rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const lbl = { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#8a9a8f', display: 'block', marginBottom: 4 }

export default function SettingsEditor() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/site_settings').then(r => r.json()).then(res => {
      if (res.value) setSettings({ ...DEFAULTS, ...res.value })
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/site_settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: settings }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const fields: [keyof Omit<Settings, 'loader_enabled'>, string, string][] = [
    ['contact_email', 'Contact Email', 'email'],
    ['whatsapp_url', 'WhatsApp Community URL', 'url'],
    ['instagram_url', 'Instagram URL', 'url'],
    ['linkedin_url', 'LinkedIn URL', 'url'],
    ['twitter_url', 'Twitter / X URL', 'url'],
    ['tagline', 'Site Tagline', 'text'],
    ['footer_note', 'Footer Note', 'text'],
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Site Settings</h2>
          <p style={{ margin: 0, fontSize: '.83rem', color: '#8a9a8f' }}>Global settings used across the public site.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Page Loader toggle */}
      <div style={{ marginBottom: 24, padding: '14px 16px', background: '#f9f8f5', borderRadius: 8, border: '1px solid #e8e4dc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '.88rem', fontWeight: 600, color: '#1a2e24' }}>Page Loader</div>
          <div style={{ fontSize: '.78rem', color: '#8a9a8f', marginTop: 2 }}>Show the full-screen loading animation on every page visit.</div>
        </div>
        <button
          onClick={() => setSettings(s => ({ ...s, loader_enabled: !s.loader_enabled }))}
          style={{
            width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: settings.loader_enabled ? '#1a3c2e' : '#d0ccc4',
            position: 'relative', transition: 'background .2s',
          }}
          aria-label={settings.loader_enabled ? 'Disable page loader' : 'Enable page loader'}
        >
          <span style={{
            position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
            left: settings.loader_enabled ? 23 : 3, transition: 'left .2s',
          }} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fields.map(([key, label, type]) => (
          <div key={key} style={key === 'tagline' || key === 'footer_note' ? { gridColumn: '1/-1' } : {}}>
            <label style={lbl}>{label}</label>
            <input
              type={type}
              style={inp}
              value={settings[key] as string}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
