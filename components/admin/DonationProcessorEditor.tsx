'use client'

import { useState, useEffect } from 'react'
import type { DonationSettings } from '@/lib/donation-settings'

const DEFAULT: DonationSettings = {
  zeffy_enabled: false,
  zeffy_general_form_url: '',
}

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const s = (bg: string, color = '#fff') => ({ padding: '6px 16px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

export default function DonationProcessorEditor() {
  const [data, setData] = useState<DonationSettings>(DEFAULT)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/content/donation_settings')
      .then(r => r.json())
      .then(res => {
        if (res.value) setData({ ...DEFAULT, ...res.value })
        setLoaded(true)
      })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/content/donation_settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: data }),
      })
      if (!res.ok) throw new Error('Save failed — your changes have not been stored.')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Donation Processors</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>
            Card (Stripe) and Bank Transfer are always available. Turn on Zeffy to offer it as a third, zero-fee choice —
            donors pick whichever works for them; nothing is forced on anyone.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', borderRadius: 10, cursor: 'pointer',
        border: data.zeffy_enabled ? '2px solid #1a3c2e' : '1px solid #e8e4dc',
        background: data.zeffy_enabled ? '#f0f4f1' : '#fff', marginBottom: 16,
      }}>
        <input
          type="checkbox"
          checked={data.zeffy_enabled}
          onChange={e => setData(d => ({ ...d, zeffy_enabled: e.target.checked }))}
          style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
        />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>🎁 Offer Zeffy (zero platform fees) as a donor choice</div>
          <div style={{ fontSize: '.8rem', color: '#8a9a8f' }}>
            100% of the gift reaches the foundation when a donor picks this. Needs a Zeffy form set below (or per-project in Donation Projects).
          </div>
          <div style={{ fontSize: '.75rem', color: '#b45309', marginTop: 6 }}>⚠️ Naira cards often fail on Zeffy — see note below.</div>
        </div>
      </label>

      <div>
        <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
          Default Zeffy Form (used on /donate when a page has no project-specific one)
        </label>
        <input
          style={inp}
          value={data.zeffy_general_form_url}
          onChange={e => setData(d => ({ ...d, zeffy_general_form_url: e.target.value }))}
          placeholder="/embed/donation-form/your-form-slug"
        />
        <p style={{ margin: '6px 0 0', fontSize: '.75rem', color: '#8a9a8f' }}>
          The <code>data-form-url</code> value from Zeffy&apos;s embed code (Share page on your Zeffy form) — not the full zeffy.com URL.
          A specific donation project&apos;s own Zeffy form (set in Donation Projects) always takes priority over this one on its own page.
        </p>
      </div>

      {data.zeffy_enabled && !data.zeffy_general_form_url && (
        <div style={{ marginTop: 16, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.3)', borderRadius: 8, padding: '12px 16px', fontSize: '.8rem', color: '#5a5a4a' }}>
          <strong style={{ color: '#0F2D1D' }}>⚠️ Heads up:</strong> Zeffy is enabled but no default form is set. The general /donate page won&apos;t show the Zeffy option
          until you add one — project pages with their own Zeffy form (like Donation Projects → Career Clarity Fair) show it regardless.
        </div>
      )}

      {data.zeffy_enabled && (
        <div style={{ marginTop: 16, background: '#fef3c7', border: '1px solid #f3cf7a', borderRadius: 8, padding: '12px 16px', fontSize: '.8rem', color: '#78350f', lineHeight: 1.6 }}>
          <strong>⚠️ Naira donors may not be able to pay via Zeffy.</strong> Our Zeffy account is UK-registered (Zeffy only supports nonprofits
          based in the US, Canada, UK, Ireland, Germany or Australia — not Nigeria), so every Zeffy charge processes in <strong>GBP</strong>, never NGN.
          A Nigerian donor&apos;s card is charged in GBP and their own bank converts it — but many Naira debit/credit cards restrict or
          cap international/foreign-currency transactions by default, so the payment can simply fail for them. That&apos;s exactly why
          Zeffy is offered as an extra <em>choice</em> here rather than a replacement: donors it doesn&apos;t work for can just use the
          Card (Stripe) tab instead, which accepts Nigerian cards natively in NGN.
        </div>
      )}
    </div>
  )
}
