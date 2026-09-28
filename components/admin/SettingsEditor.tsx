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
  google_business_url: string
  bing_places_url: string
  google_site_verification: string
  bing_site_verification: string
}

const DEFAULTS: Settings = {
  contact_email: 'info@wissenhaus.org',
  whatsapp_url: 'https://chat.whatsapp.com/wissenhaus',
  instagram_url: '',
  linkedin_url: '',
  twitter_url: '',
  tagline: 'Empowering Youth, Shaping Futures',
  footer_note: '',
  google_business_url: '',
  bing_places_url: '',
  google_site_verification: '',
  bing_site_verification: '',
}

const lbl = { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#8a9a8f', display: 'block', marginBottom: 4 }

export default function SettingsEditor() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/content/site_settings').then(r => r.json()).then(res => {
      if (res.value) setSettings({ ...DEFAULTS, ...res.value })
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/content/site_settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: settings }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed — your changes have not been stored.')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const fields: [keyof Settings, string, string][] = [
    ['contact_email', 'Contact Email', 'email'],
    ['whatsapp_url', 'WhatsApp Community URL', 'url'],
    ['instagram_url', 'Instagram URL', 'url'],
    ['linkedin_url', 'LinkedIn URL', 'url'],
    ['twitter_url', 'Twitter / X URL', 'url'],
    ['tagline', 'Site Tagline', 'text'],
    ['footer_note', 'Footer Note', 'text'],
  ]

  const listingFields: [keyof Settings, string, string, string][] = [
    ['google_business_url', 'Google Business Profile URL', 'url', 'Shown as a footer link once set.'],
    ['bing_places_url', 'Bing Places for Business URL', 'url', 'Shown as a footer link once set.'],
    ['google_site_verification', 'Google Search Console Verification Code', 'text', "The value from Google's HTML meta tag verification method — not the whole tag, just the content."],
    ['bing_site_verification', 'Bing Webmaster Tools Verification Code', 'text', "The value from Bing's meta tag verification method — not the whole tag, just the content."],
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
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
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div className="rgrid-2" style={{ gap: 16, marginBottom: 28 }}>
        {fields.map(([key, label, type]) => (
          <div key={key} style={key === 'tagline' || key === 'footer_note' ? { gridColumn: '1/-1' } : {}}>
            <label style={lbl}>{label}</label>
            <input
              type={type}
              className="admin-input"
              value={settings[key] as string}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Business Listings &amp; Search Console</div>
      <div className="rgrid-2" style={{ gap: 16 }}>
        {listingFields.map(([key, label, type, hint]) => (
          <div key={key}>
            <label style={lbl}>{label}</label>
            <input
              type={type}
              className="admin-input"
              value={settings[key] as string}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            />
            <p style={{ margin: '4px 0 0', fontSize: '.74rem', color: '#8a9a8f' }}>{hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
