'use client'

import { useState, useEffect } from 'react'
import type { FoundationDetails } from '@/app/donate/receipt/[certId]/page'

const DEFAULT: FoundationDetails = {
  legal_name: 'Wissen-Haus Youth Empowerment Foundation',
  rc_number: '',
  tax_id: '',
  address: 'Ibadan, Oyo State, Nigeria',
  email: 'director@wissenhaus.org',
  signatory_name: 'Benz Olagbaye',
  signatory_role: 'Founder & Executive Director',
}

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const s = (bg: string, color = '#fff') => ({ padding: '6px 16px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

const FIELDS: [keyof FoundationDetails, string, string][] = [
  ['legal_name', 'Legal Foundation Name', 'Wissen-Haus Youth Empowerment Foundation'],
  ['rc_number', 'CAC Registration Number (RC No.)', 'e.g. RC1234567'],
  ['tax_id', 'Tax Identification Number (TIN) — optional', 'e.g. 1234567-0001'],
  ['address', 'Registered Address', 'Ibadan, Oyo State, Nigeria'],
  ['email', 'Official Email', 'director@wissenhaus.org'],
  ['signatory_name', 'Authorised Signatory Name', 'Benz Olagbaye'],
  ['signatory_role', 'Signatory Role / Title', 'Founder & Executive Director'],
]

export default function FoundationDetailsEditor() {
  const [details, setDetails] = useState<FoundationDetails>(DEFAULT)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/foundation_details')
      .then(r => r.json())
      .then(res => {
        if (res.value) setDetails({ ...DEFAULT, ...res.value })
        setLoaded(true)
      })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/foundation_details', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: details }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Foundation Legal Details</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>These details appear on every donation certificate issued. Set once, used everywhere.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button style={s('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Details'}</button>
        </div>
      </div>

      <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.3)', borderRadius: 8, padding: '16px 20px', marginBottom: 20, fontSize: '.8rem', color: '#5a5a4a', lineHeight: 1.6 }}>
        <strong style={{ color: '#0F2D1D' }}>💡 Important:</strong> Fill in your CAC registration number and TIN before issuing donation receipts. These are required for the receipts to be valid for tax purposes.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {FIELDS.map(([key, label, placeholder]) => (
          <div key={key} style={key === 'legal_name' || key === 'address' ? { gridColumn: '1 / -1' } : undefined}>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em', marginBottom: 4 }}>
              {label}
            </label>
            <input
              style={inp}
              value={(details[key] ?? '') as string}
              onChange={e => setDetails(d => ({ ...d, [key]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
