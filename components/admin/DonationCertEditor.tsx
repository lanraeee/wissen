'use client'

import { useState, useEffect } from 'react'
import type { DonationCert } from '@/app/donate/receipt/[certId]/page'

const CURRENCIES: DonationCert['currency'][] = ['NGN', 'USD', 'GBP', 'EUR']

type DraftCert = Omit<DonationCert, 'cert_id'>

const BLANK: DraftCert = {
  donor_name: '',
  donor_email: '',
  donor_address: '',
  amount: 0,
  currency: 'NGN',
  date: new Date().toISOString().slice(0, 10),
  purpose: 'General donation to youth empowerment programmes',
  notes: '',
  issued_at: new Date().toISOString().slice(0, 10),
}

function toIso(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr).toISOString()
  return dateStr
}

function toDateInput(isoStr: string) {
  return isoStr.slice(0, 10)
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
const lbl = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em' }

function CertForm({ title, draft, setDraft, onSave, onCancel, saveLabel, saving, disabled, currencies, currencySym }: {
  title: string
  draft: DraftCert
  setDraft: React.Dispatch<React.SetStateAction<DraftCert>>
  onSave: () => void
  onCancel: () => void
  saveLabel: string
  saving: boolean
  disabled: boolean
  currencies: DonationCert['currency'][]
  currencySym: Record<string, string>
}) {
  return (
    <div style={{ background: '#f0f7f3', border: '1px solid #c8e0d0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F2D1D' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Donor Full Name *</label>
          <input style={inp} value={draft.donor_name} onChange={e => setDraft(d => ({ ...d, donor_name: e.target.value }))} placeholder="e.g. Adebayo Okafor" />
        </div>
        <div>
          <label style={lbl}>Donor Email</label>
          <input style={inp} type="email" value={draft.donor_email ?? ''} onChange={e => setDraft(d => ({ ...d, donor_email: e.target.value }))} placeholder="donor@example.com" />
        </div>
        <div>
          <label style={lbl}>Donor Address</label>
          <input style={inp} value={draft.donor_address ?? ''} onChange={e => setDraft(d => ({ ...d, donor_address: e.target.value }))} placeholder="City, State, Country" />
        </div>
        <div>
          <label style={lbl}>Amount *</label>
          <input style={inp} type="number" min="0" step="0.01" value={draft.amount || ''} onChange={e => setDraft(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
        </div>
        <div>
          <label style={lbl}>Currency *</label>
          <select style={inp} value={draft.currency} onChange={e => setDraft(d => ({ ...d, currency: e.target.value as DonationCert['currency'] }))}>
            {currencies.map(c => <option key={c} value={c}>{c} ({currencySym[c]})</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Date of Donation *</label>
          <input style={inp} type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
        </div>
        <div>
          <label style={lbl}>Issue Date *</label>
          <input style={inp} type="date" value={toDateInput(draft.issued_at)} onChange={e => setDraft(d => ({ ...d, issued_at: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Purpose *</label>
          <input style={inp} value={draft.purpose} onChange={e => setDraft(d => ({ ...d, purpose: e.target.value }))} placeholder="General donation to youth empowerment programmes" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Additional Notes (optional)</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Any additional details to include on the receipt…" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button style={s('#1a3c2e')} onClick={onSave} disabled={saving || disabled}>{saveLabel}</button>
        <button style={s('#e8e4dc', '#3a4a3f')} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function DonationCertEditor() {
  const [certs, setCerts] = useState<DonationCert[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<DraftCert>(BLANK)
  const [newCertId, setNewCertId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<DraftCert>(BLANK)

  useEffect(() => {
    fetch('/api/admin/content/donation_certificates')
      .then(r => r.json())
      .then(res => { setCerts(res.value ?? []); setLoaded(true) })
  }, [])

  async function issue() {
    const cert_id = genId()
    const newCert: DonationCert = { ...draft, cert_id, issued_at: toIso(draft.issued_at) }
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

  function startEdit(cert: DonationCert) {
    setEditId(cert.cert_id)
    setEditDraft({ ...cert, issued_at: toDateInput(cert.issued_at) })
    setShowForm(false)
  }

  async function saveEdit() {
    if (!editId) return
    const updated = certs.map(c =>
      c.cert_id === editId ? { ...editDraft, cert_id: editId, issued_at: toIso(editDraft.issued_at) } : c
    )
    setSaving(true)
    await fetch('/api/admin/content/donation_certificates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: updated }),
    })
    setCerts(updated)
    setSaving(false)
    setEditId(null)
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
          {!showForm && !editId && (
            <button style={s('#1a3c2e')} onClick={() => setShowForm(true)}>+ Issue Certificate</button>
          )}
        </div>
      </div>

      {/* Issue form */}
      {showForm && (
        <CertForm
          title="New Donation Certificate"
          draft={draft}
          setDraft={setDraft}
          onSave={issue}
          onCancel={() => { setShowForm(false); setDraft(BLANK) }}
          saveLabel={saving ? 'Issuing…' : 'Issue Certificate'}
          saving={saving}
          disabled={!draft.donor_name || !draft.amount || !draft.date || !draft.purpose}
          currencies={CURRENCIES}
          currencySym={CURRENCY_SYM}
        />
      )}

      {/* Issued certificates list */}
      {certs.length === 0 ? (
        <p style={{ color: '#8a9a8f', fontSize: '.85rem', padding: '16px 0' }}>No certificates issued yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {certs.map(c => (
            <div key={c.cert_id}>
              {editId === c.cert_id ? (
                <CertForm
                  title={`Edit · ${c.cert_id}`}
                  draft={editDraft}
                  setDraft={setEditDraft}
                  onSave={saveEdit}
                  onCancel={() => setEditId(null)}
                  saveLabel={saving ? 'Saving…' : 'Save Changes'}
                  saving={saving}
                  disabled={!editDraft.donor_name || !editDraft.amount || !editDraft.date || !editDraft.purpose}
                  currencies={CURRENCIES}
                  currencySym={CURRENCY_SYM}
                />
              ) : (
                <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <strong style={{ fontSize: '.9rem' }}>{c.donor_name}</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '.68rem', color: '#B8952A', background: 'rgba(184,149,42,0.1)', padding: '1px 6px', borderRadius: 4 }}>{c.cert_id}</span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>
                      {CURRENCY_SYM[c.currency]}{c.amount.toLocaleString()} · Donated {new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Issued {new Date(c.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={`/donate/receipt/${c.cert_id}`} target="_blank" rel="noopener noreferrer"
                      style={{ ...s('#1d4ed8'), textDecoration: 'none', display: 'inline-block' }}>View</a>
                    <button style={s('#0F2D1D')} onClick={() => startEdit(c)}>Edit</button>
                    <button style={s('#dc2626')} onClick={() => revoke(c.cert_id)}>Revoke</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
