'use client'

import { useState, useEffect } from 'react'

export interface ContactDetails {
  primary_email: string
  admin_emails: string[]
  support_email: string
  phone_nigeria: string
  phone_uk: string
  whatsapp_url: string
  instagram_url: string
  linkedin_url: string
  twitter_url: string
  google_business_url: string
  bing_places_url: string
  address_nigeria: string
  address_uk: string
  tagline: string
}

const DEFAULT: ContactDetails = {
  primary_email: 'info@wissenhaus.org',
  admin_emails: ['director@wissenhaus.org', 'wissenhaus@outlook.com'],
  support_email: 'info@wissenhaus.org',
  phone_nigeria: '+234800947736',
  phone_uk: '',
  whatsapp_url: '',
  instagram_url: 'https://www.instagram.com/wissen_haus',
  linkedin_url: 'https://www.linkedin.com/company/wissen-haus-empowerment-foundation',
  twitter_url: '',
  google_business_url: '',
  bing_places_url: '',
  address_nigeria: 'Ibadan, Oyo State, Nigeria',
  address_uk: '',
  tagline: 'Empowering Youth, Shaping Futures',
}

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const s = (bg: string, color = '#fff') => ({ padding: '6px 16px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

export default function ContactDetailsEditor() {
  const [details, setDetails] = useState<ContactDetails>(DEFAULT)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/content/contact_details')
      .then(r => r.json())
      .then(res => {
        if (res.value) setDetails({ ...DEFAULT, ...res.value })
        setLoaded(true)
      })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/content/contact_details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: details }),
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

  function updateAdminEmails(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const emails = e.target.value
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0)
    setDetails(d => ({ ...d, admin_emails: emails }))
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Contact Details</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>Manage all contact information from one place. Changes appear instantly across the site.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Details'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.3)', borderRadius: 8, padding: '16px 20px', marginBottom: 20, fontSize: '.8rem', color: '#5a5a4a', lineHeight: 1.6 }}>
        <strong style={{ color: '#0F2D1D' }}>💡 Instant Updates:</strong> Edit any field below and save. All email notifications, website footers, and contact forms will reflect your changes immediately.
      </div>

      {/* Primary Contact Information */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#1a3c2e', fontWeight: 600 }}>Primary Contact</h3>
        <div className="rgrid-2" style={{ gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              Main Email (Website, Forms)
            </label>
            <input
              style={inp}
              type="email"
              value={details.primary_email}
              onChange={e => setDetails(d => ({ ...d, primary_email: e.target.value }))}
              placeholder="info@wissenhaus.org"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              Support Email (Tickets, Replies)
            </label>
            <input
              style={inp}
              type="email"
              value={details.support_email}
              onChange={e => setDetails(d => ({ ...d, support_email: e.target.value }))}
              placeholder="info@wissenhaus.org"
            />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
            Admin Notification Emails (one per line)
          </label>
          <textarea
            style={{ ...inp, minHeight: 80, fontFamily: 'monospace', fontSize: '.8rem' }}
            value={details.admin_emails.join('\n')}
            onChange={updateAdminEmails}
            placeholder="director@wissenhaus.org&#10;wissenhaus@outlook.com"
          />
          <p style={{ margin: '6px 0 0', fontSize: '.75rem', color: '#8a9a8f' }}>All notifications for contact forms, volunteer applications, and donations go to these addresses</p>
        </div>
      </div>

      {/* Office Locations */}
      <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #e8e4dc' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#1a3c2e', fontWeight: 600 }}>Office Locations</h3>
        <div className="rgrid-2" style={{ gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.3rem' }} aria-hidden="true">🇳🇬</span>
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#1a3c2e' }}>Nigeria</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
                Phone
              </label>
              <input
                style={inp}
                type="tel"
                value={details.phone_nigeria}
                onChange={e => setDetails(d => ({ ...d, phone_nigeria: e.target.value }))}
                placeholder="+234800947736"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
                Address
              </label>
              <input
                style={inp}
                value={details.address_nigeria}
                onChange={e => setDetails(d => ({ ...d, address_nigeria: e.target.value }))}
                placeholder="Ibadan, Oyo State, Nigeria"
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.3rem' }} aria-hidden="true">🇬🇧</span>
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#1a3c2e' }}>United Kingdom</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
                Phone
              </label>
              <input
                style={inp}
                type="tel"
                value={details.phone_uk}
                onChange={e => setDetails(d => ({ ...d, phone_uk: e.target.value }))}
                placeholder="+44 20 0000 0000"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
                Address
              </label>
              <input
                style={inp}
                value={details.address_uk}
                onChange={e => setDetails(d => ({ ...d, address_uk: e.target.value }))}
                placeholder="Leave blank until registered"
              />
            </div>
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '.75rem', color: '#8a9a8f' }}>Leave the UK fields blank until there&apos;s a UK office — they won&apos;t be shown on the site until filled in.</p>
      </div>

      {/* Social & Web */}
      <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #e8e4dc' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#1a3c2e', fontWeight: 600 }}>Social Media & Web</h3>
        <div className="rgrid-2" style={{ gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              Instagram URL
            </label>
            <input
              style={inp}
              type="url"
              value={details.instagram_url}
              onChange={e => setDetails(d => ({ ...d, instagram_url: e.target.value }))}
              placeholder="https://www.instagram.com/wissen_haus"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              LinkedIn URL
            </label>
            <input
              style={inp}
              type="url"
              value={details.linkedin_url}
              onChange={e => setDetails(d => ({ ...d, linkedin_url: e.target.value }))}
              placeholder="https://www.linkedin.com/company/wissen-haus-empowerment-foundation"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              Twitter / X URL
            </label>
            <input
              style={inp}
              type="url"
              value={details.twitter_url}
              onChange={e => setDetails(d => ({ ...d, twitter_url: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              WhatsApp Community URL
            </label>
            <input
              style={inp}
              type="url"
              value={details.whatsapp_url}
              onChange={e => setDetails(d => ({ ...d, whatsapp_url: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              Google Business URL
            </label>
            <input
              style={inp}
              type="url"
              value={details.google_business_url}
              onChange={e => setDetails(d => ({ ...d, google_business_url: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              Bing Places URL
            </label>
            <input
              style={inp}
              type="url"
              value={details.bing_places_url}
              onChange={e => setDetails(d => ({ ...d, bing_places_url: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div style={{ paddingTop: 20, borderTop: '1px solid #e8e4dc' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#1a3c2e', fontWeight: 600 }}>Branding</h3>
        <div>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
            Site Tagline
          </label>
          <input
            style={inp}
            value={details.tagline}
            onChange={e => setDetails(d => ({ ...d, tagline: e.target.value }))}
            placeholder="Empowering Youth, Shaping Futures"
          />
        </div>
      </div>
    </div>
  )
}
