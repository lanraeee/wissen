'use client'

import { useState, useEffect } from 'react'
import type { DonationCert } from '@/app/donate/receipt/[certId]/page'

const CURRENCIES: DonationCert['currency'][] = ['NGN', 'USD', 'GBP', 'EUR']

const BLANK: Omit<DonationCert, 'cert_id' | 'issued_at'> = {
  donor_name: '',
  donor_email: '',
  donor_address: '',
  amount: 0,
  currency: 'NGN',
  date: new Date().toISOString().slice(0, 10),
  purpose: 'General donation to youth empowerment programmes',
  notes: '',
}

function genId() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  return `WH-DON-${hex}`
}

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
} as const)

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }

export default function DonationCertEditor() {
  const [certs, setCerts] = useState<DonationCert[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Omit<DonationCert, 'cert_id' | 'issued_at'>>(BLANK)
  const [newCertId, setNewCertId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/content/donation_certificates')
      .then(r => r.json())
      .then(res => { setCerts(res.value ?? []); setLoaded(true) })
  }, [])

  async function issue() {
    const cert_id = genId()
    const issued_at = new Date().toISOString()
    const newCert: DonationCert = { ...draft, cert_id, issued_at }
    const updated = [newCert, ...certs]
    setSaving(true)
    await fetch('/api/admin/content/donation_certificates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: updated }),
    })
    setCerts(updated)
    setSaving(false)
    setSaved(true)
    setNewCertId(cert_id)
    setShowForm(false)
    setDraft(BLANK)
    setTimeout(() => setSaved(false), 5000)
  }

  async function revoke(certId: string) {
    if (!confirm(`Revoke certificate ${certId}? This removes it from the public record.`)) return
    const updated = certs.filter(c => c.cert_id !== certId)
    await fetch('/api/admin/content/donation_certificates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: updated }),
    })
    setCerts(updated)
  }

  const CURRENCY_SYM: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Donation Certificates</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>Issue official tax receipts to donors. Each certificate gets a unique public URL.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && newCertId && (
            <a href={`/donate/receipt/${newCertId}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '.78rem', color: '#16a34a', fontWeight: 600, textDecoration: 'underline' }}>
              ✓ Issued — View receipt ↗
            </a>
          )}
          {!showForm && (
            <button style={s('#1a3c2e')} onClick={() => setShowForm(true)}>+ Issue Certificate</button>
          )}
        </div>
      </div>

      {/* Issue form */}
      {showForm && (
        <div style={{ background: '#f0f7f3', border: '1px solid #c8e0d0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F2D1D' }}>New Donation Certificate</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Donor Full Name *</label>
              <input style={inp} value={draft.donor_name} onChange={e => setDraft(d => ({ ...d, donor_name: e.target.value }))} placeholder="e.g. Adebayo Okafor" />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Donor Email</label>
              <input style={inp} type="email" value={draft.donor_email ?? ''} onChange={e => setDraft(d => ({ ...d, donor_email: e.target.value }))} placeholder="donor@example.com" />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Donor Address</label>
              <input style={inp} value={draft.donor_address ?? ''} onChange={e => setDraft(d => ({ ...d, donor_address: e.target.value }))} placeholder="City, State, Country" />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Amount *</label>
              <input style={inp} type="number" min="0" step="0.01" value={draft.amount || ''} onChange={e => setDraft(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Currency *</label>
              <select style={inp} value={draft.currency} onChange={e => setDraft(d => ({ ...d, currency: e.target.value as DonationCert['currency'] }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c} ({CURRENCY_SYM[c]})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Date of Donation *</label>
              <input style={inp} type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Purpose *</label>
              <input style={inp} value={draft.purpose} onChange={e => setDraft(d => ({ ...d, purpose: e.target.value }))} placeholder="General donation to youth empowerment programmes" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.06em' }}>Additional Notes (optional)</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Any additional details to include on the receipt…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              style={s('#1a3c2e')}
              onClick={issue}
              disabled={saving || !draft.donor_name || !draft.amount || !draft.date || !draft.purpose}
            >
              {saving ? 'Issuing…' : 'Issue Certificate'}
            </button>
            <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => { setShowForm(false); setDraft(BLANK) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Issued certificates list */}
      {certs.length === 0 ? (
        <p style={{ color: '#8a9a8f', fontSize: '.85rem', padding: '16px 0' }}>No certificates issued yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {certs.map(c => (
            <div key={c.cert_id} style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <strong style={{ fontSize: '.9rem' }}>{c.donor_name}</strong>
                  <span style={{ fontFamily: 'monospace', fontSize: '.68rem', color: '#B8952A', background: 'rgba(184,149,42,0.1)', padding: '1px 6px', borderRadius: 4 }}>{c.cert_id}</span>
                </div>
                <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>
                  {CURRENCY_SYM[c.currency]}{c.amount.toLocaleString()} · {new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={`/donate/receipt/${c.cert_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ ...s('#1d4ed8'), textDecoration: 'none', display: 'inline-block' }}>View</a>
                <button style={s('#dc2626')} onClick={() => revoke(c.cert_id)}>Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
