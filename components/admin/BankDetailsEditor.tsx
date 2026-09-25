'use client'

import { useState, useEffect } from 'react'
import {
  DEFAULT_BANK_DETAILS, CURRENCY_SYMBOL,
  type BankDetails, type BankAccount, type BankCurrency, type CorrespondentBank,
} from '@/lib/bank-transfer-shared'

const ALL_CURRENCIES: BankCurrency[] = ['NGN', 'USD', 'GBP', 'EUR']

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const lbl = { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', letterSpacing: '.06em', display: 'block', marginBottom: 3 }
const s = (bg: string, color = '#fff') => ({ padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

function blankAccount(currency: BankCurrency): BankAccount {
  return { currency, account_number: '', sort_code: '', iban: '', swift: '', note: '' }
}

export default function BankDetailsEditor() {
  const [data, setData] = useState<BankDetails>(DEFAULT_BANK_DETAILS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/content/bank_transfer_details')
      .then(async r => {
        // This key is director-only server-side. Say so plainly rather than
        // rendering the seeded defaults to someone who cannot save them.
        if (r.status === 403) { setForbidden(true); setLoaded(true); return }
        const res = await r.json()
        if (res.value) {
          setData({
            ...DEFAULT_BANK_DETAILS,
            ...res.value,
            accounts: res.value.accounts ?? DEFAULT_BANK_DETAILS.accounts,
          })
        }
        setLoaded(true)
      })
      .catch(() => { setError('Could not load bank details.'); setLoaded(true) })
  }, [])

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/content/bank_transfer_details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: data }),
      })
      if (res.status === 403) throw new Error('Only the director can change bank details.')
      if (!res.ok) throw new Error('Save failed â€” your changes have not been stored.')
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function patchAccount(currency: BankCurrency, patch: Partial<BankAccount>) {
    setData(d => ({ ...d, accounts: d.accounts.map(a => a.currency === currency ? { ...a, ...patch } : a) }))
  }

  // The correspondent block starts absent rather than empty, so the first
  // keystroke has to conjure one before it can be patched.
  function patchCorrespondent(currency: BankCurrency, patch: Partial<CorrespondentBank>) {
    setData(d => ({
      ...d,
      accounts: d.accounts.map(a => a.currency === currency
        ? { ...a, correspondent: { bank_name: '', swift: '', account_number: '', ...a.correspondent, ...patch } }
        : a),
    }))
  }

  function addAccount(currency: BankCurrency) {
    setData(d => ({ ...d, accounts: [...d.accounts, blankAccount(currency)] }))
  }

  function removeAccount(currency: BankCurrency) {
    setData(d => ({ ...d, accounts: d.accounts.filter(a => a.currency !== currency) }))
  }

  const unusedCurrencies = ALL_CURRENCIES.filter(c => !data.accounts.some(a => a.currency === c))

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  if (forbidden) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Bank Transfer Details</h2>
        <p style={{ margin: 0, fontSize: '.88rem', color: '#8a9a8f', maxWidth: '60ch' }}>
          These are the account details donors are told to pay into, so only the director can
          view or change them. Ask the director if something here needs updating.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Bank Transfer Details</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f', maxWidth: '58ch' }}>
            Shown to donors who choose to give by bank transfer, and included in their instructions email.
            Confirm incoming transfers under Submissions â†’ Bank Transfers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          {error && <span style={{ fontSize: '.8rem', color: '#dc2626', maxWidth: '32ch' }}>{error}</span>}
          <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {saving ? 'Savingâ€¦' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Availability */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, background: data.enabled ? '#f0f7f3' : '#fdf0ef',
        border: `1px solid ${data.enabled ? '#c8e0d0' : '#f0c8c4'}`, borderRadius: 8,
        padding: '12px 14px', marginBottom: 20, cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={data.enabled}
          onChange={e => setData(d => ({ ...d, enabled: e.target.checked }))}
          style={{ width: 16, height: 16 }}
        />
        <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#1a2e24' }}>
          {data.enabled
            ? 'Bank transfer is offered to donors on the donate page'
            : 'Bank transfer is hidden â€” donors can only give by card'}
        </span>
      </label>

      {/* Shared account holder details */}
      <div style={{ background: '#f9f7f3', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 12 }}>Account Holder</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={lbl}>Account Name</label>
            <input style={inp} value={data.account_name} onChange={e => setData(d => ({ ...d, account_name: e.target.value }))} placeholder="Wissen Haus Empowerment Foundation" />
          </div>
          <div>
            <label style={lbl}>Bank Name</label>
            <input style={inp} value={data.bank_name} onChange={e => setData(d => ({ ...d, bank_name: e.target.value }))} placeholder="UBA" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Bank Address (optional â€” often needed for international transfers)</label>
            <input style={inp} value={data.bank_address ?? ''} onChange={e => setData(d => ({ ...d, bank_address: e.target.value }))} placeholder="57 Marina, Lagos Island, Lagos, Nigeria" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Note to Donors</label>
            <textarea
              style={{ ...inp, minHeight: 60, resize: 'vertical' }}
              value={data.instructions ?? ''}
              onChange={e => setData(d => ({ ...d, instructions: e.target.value }))}
              placeholder="Please quote your donation reference in the transfer narrationâ€¦"
            />
          </div>
        </div>
      </div>

      {/* Per-currency accounts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#3a4a3f' }}>Accounts by Currency ({data.accounts.length})</div>
        {unusedCurrencies.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {unusedCurrencies.map(c => (
              <button key={c} style={s('#1a3c2e')} onClick={() => addAccount(c)}>+ {c}</button>
            ))}
          </div>
        )}
      </div>

      {data.accounts.length === 0 && (
        <p style={{ color: '#c0392b', fontSize: '.85rem', padding: '12px 0' }}>
          No accounts configured â€” donors will not be able to complete a bank transfer.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.accounts.map(acc => (
          <div key={acc.currency} style={{ background: '#f9f7f3', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: '.9rem' }}>
                {CURRENCY_SYMBOL[acc.currency]} {acc.currency}
              </strong>
              <button style={s('#dc2626')} onClick={() => removeAccount(acc.currency)}>Remove</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Account Number *</label>
                <input
                  style={{ ...inp, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  value={acc.account_number}
                  onChange={e => patchAccount(acc.currency, { account_number: e.target.value })}
                  placeholder="1029685261"
                />
              </div>
              <div>
                <label style={lbl}>Sort Code (optional)</label>
                <input style={inp} value={acc.sort_code ?? ''} onChange={e => patchAccount(acc.currency, { sort_code: e.target.value })} placeholder="00-00-00" />
              </div>
              <div>
                <label style={lbl}>SWIFT / BIC (optional)</label>
                <input style={inp} value={acc.swift ?? ''} onChange={e => patchAccount(acc.currency, { swift: e.target.value })} placeholder="UNAFNGLA" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>IBAN (optional)</label>
                <input style={inp} value={acc.iban ?? ''} onChange={e => patchAccount(acc.currency, { iban: e.target.value })} placeholder="GB00 XXXX 0000 0000 0000 00" />
              </div>

              {/* The intermediary leg, kept visually separate from the fields
                  above because the numbers here belong to our bank rather than
                  to us â€” mixing the two is exactly how a donation gets
                  misrouted. */}
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid #e4e0d8', paddingTop: 12, marginTop: 2 }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#3a4a3f', marginBottom: 2 }}>
                  Correspondent / Intermediary Bank (for transfers from abroad)
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '.73rem', color: '#8a9a8f', maxWidth: '62ch' }}>
                  These belong to <strong>{data.bank_name || 'our bank'}</strong>, not to us â€” a sender&apos;s
                  bank pays them first, and the money is then credited to the account above. Leave the
                  block blank for domestic-only currencies. Both a name and a SWIFT are required before
                  any of it is shown to donors.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Correspondent Bank Name</label>
                    <input style={inp} value={acc.correspondent?.bank_name ?? ''}
                      onChange={e => patchCorrespondent(acc.currency, { bank_name: e.target.value })}
                      placeholder="Citibank New York" />
                  </div>
                  <div>
                    <label style={lbl}>Correspondent SWIFT / BIC</label>
                    <input style={inp} value={acc.correspondent?.swift ?? ''}
                      onChange={e => patchCorrespondent(acc.currency, { swift: e.target.value })}
                      placeholder="CITIUS33" />
                  </div>
                  <div>
                    <label style={lbl}>Routing / ABA Number (US wires)</label>
                    <input style={{ ...inp, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                      value={acc.correspondent?.routing_number ?? ''}
                      onChange={e => patchCorrespondent(acc.currency, { routing_number: e.target.value })}
                      placeholder="021000089" />
                  </div>
                  <div>
                    <label style={lbl}>Correspondent Sort Code</label>
                    <input style={inp} value={acc.correspondent?.sort_code ?? ''}
                      onChange={e => patchCorrespondent(acc.currency, { sort_code: e.target.value })}
                      placeholder="18 50 08" />
                  </div>
                  <div>
                    <label style={lbl}>Our Bank&apos;s Account There</label>
                    <input style={{ ...inp, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                      value={acc.correspondent?.account_number ?? ''}
                      onChange={e => patchCorrespondent(acc.currency, { account_number: e.target.value })}
                      placeholder="36320321" />
                  </div>
                  <div>
                    <label style={lbl}>Our Bank&apos;s IBAN There</label>
                    <input style={inp} value={acc.correspondent?.iban ?? ''}
                      onChange={e => patchCorrespondent(acc.currency, { iban: e.target.value })}
                      placeholder="GB07CITI18500813664090" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
