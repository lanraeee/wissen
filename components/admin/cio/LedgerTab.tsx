'use client'

import { useCallback, useEffect, useState } from 'react'
import { inp, lbl, btn, th, td, fmtDate, dateInput, humanise } from '../cio-ui'
import Badge from './Badge'
import {
  CURRENCIES, LEDGER_CATEGORIES, LEDGER_LIMIT, SOURCE_LABELS, formatMoney, totalsByCurrency,
  type LedgerRow, type LedgerSource,
} from '@/lib/ledger-shared'

type Entry = LedgerRow & {
  id: string
  account_label: string | null
  counterparty: string | null
  fee: string | null
  is_public: boolean
  excluded: boolean
  overridden: boolean
  override_reason: string | null
  original: Record<string, unknown> | null
  updated_by: string | null
}

interface Provider {
  key: string
  label: string
  configured: boolean
  lastRunAt: string | null
  lastStatus: string | null
  lastError: string | null
  lastCount: number | null
}

type Form = {
  occurred_on: string
  direction: 'in' | 'out'
  amount: string
  currency: string
  description: string
  category: string
  account_label: string
  counterparty: string
  is_transfer: boolean
  is_public: boolean
  excluded: boolean
  override_reason: string
}

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY: Form = {
  occurred_on: today(), direction: 'in', amount: '', currency: 'GBP', description: '', category: '',
  account_label: '', counterparty: '', is_transfer: false, is_public: true, excluded: false, override_reason: '',
}

function fromEntry(e: Entry): Form {
  return {
    occurred_on: dateInput(e.occurred_on), direction: e.direction, amount: String(e.amount), currency: e.currency,
    description: e.description, category: e.category ?? '', account_label: e.account_label ?? '',
    counterparty: e.counterparty ?? '', is_transfer: !!e.is_transfer, is_public: e.is_public, excluded: e.excluded,
    override_reason: '',
  }
}

function since(iso: string | null) {
  if (!iso) return 'never'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  return hrs < 48 ? `${hrs} h ago` : new Date(iso).toLocaleDateString('en-GB')
}

export default function LedgerTab() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Form | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whf-cio/ledger')
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setEntries(data.entries)
      setProviders(data.providers)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Request failed')
      await load()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function connectTide() {
    setConnecting(true); setError('')
    try {
      const res = await fetch('/api/admin/whf-cio/ledger/gocardless/connect', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not start the connection')
      window.location.href = data.link
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the connection')
      setConnecting(false)
    }
  }

  function openNew() { setEditing(null); setForm({ ...EMPTY, occurred_on: today() }); setError('') }
  function openEdit(e: Entry) { setEditing(e); setForm(fromEntry(e)); setError('') }
  function close() { setEditing(null); setForm(null) }

  async function save() {
    if (!form) return
    if (!form.description.trim() || form.amount === '') { setError('Description and amount are required'); return }
    const synced = editing && editing.source !== 'manual'
    if (synced && !form.override_reason.trim()) { setError('Give a reason for overriding a bank-synced entry'); return }
    const body = {
      occurred_on: form.occurred_on, direction: form.direction, amount: form.amount, currency: form.currency,
      description: form.description, category: form.category || null, account_label: form.account_label || null,
      counterparty: form.counterparty || null, is_transfer: form.is_transfer, is_public: form.is_public,
      ...(editing ? { excluded: form.excluded, override_reason: form.override_reason || undefined } : {}),
    }
    const ok = await call(editing ? `/api/admin/whf-cio/ledger/${editing.id}` : '/api/admin/whf-cio/ledger', editing ? 'PUT' : 'POST', body)
    if (ok) close()
  }

  async function remove() {
    if (!editing || !confirm('Delete this manual entry? This cannot be undone.')) return
    if (await call(`/api/admin/whf-cio/ledger/${editing.id}`, 'DELETE')) close()
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const totals = totalsByCurrency(entries)
  const synced = editing && editing.source !== 'manual'
  const set = (patch: Partial<Form>) => form && setForm({ ...form, ...patch })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Financial Ledger</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>
            The last {LEDGER_LIMIT} transactions across Stripe and the foundation&apos;s bank accounts, plus manual entries.
            Published at <a href="/transparency/ledger" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>/transparency/ledger</a> without
            payer names or bank references.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn('#8a9a8f')} onClick={() => call('/api/admin/whf-cio/ledger/sync', 'POST')} disabled={busy}>{busy ? 'Working…' : 'Sync now'}</button>
          <button style={btn('#1a3c2e')} onClick={openNew} disabled={form !== null}>+ Manual entry</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {providers.map(p => (
          <div key={p.key} style={{ border: '1px solid #e8e4dc', borderRadius: 8, padding: '8px 12px', fontSize: '.78rem', minWidth: 200 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
            {!p.configured ? <Badge tone="grey">Not connected</Badge>
              : p.lastStatus === 'error' ? <Badge tone="red">Sync failed</Badge>
              : p.lastStatus === 'ok' ? <Badge tone="green">Synced {since(p.lastRunAt)}</Badge>
              : <Badge tone="amber">Waiting for first sync</Badge>}
            {p.configured && p.lastStatus === 'error' && p.lastError && (
              <div style={{ color: '#dc2626', marginTop: 4 }}>{p.lastError}</div>
            )}
            {p.key === 'gocardless' && (
              <button
                style={{ ...btn('#1a3c2e'), marginTop: 8, padding: '3px 10px', fontSize: '.72rem' }}
                onClick={connectTide}
                disabled={connecting}
              >
                {connecting ? 'Opening Tide…' : p.configured ? 'Connect another account' : 'Connect Tide'}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>
      )}

      {form && (
        <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          {synced && editing && (
            <p style={{ margin: '0 0 14px', fontSize: '.82rem', color: '#b45309' }}>
              This entry came from {SOURCE_LABELS[editing.source as LedgerSource]}. Saving a change is a director override:
              it is recorded in the activity log, and later syncs will no longer update this entry.
            </p>
          )}
          <div className="rgrid-2" style={{ gap: 14, marginBottom: 16 }}>
            <div><label style={lbl}>Date *</label><input style={inp} type="date" value={form.occurred_on} onChange={e => set({ occurred_on: e.target.value })} /></div>
            <div>
              <label style={lbl}>Direction *</label>
              <select style={inp} value={form.direction} onChange={e => set({ direction: e.target.value as 'in' | 'out' })}>
                <option value="in">Money in</option><option value="out">Money out</option>
              </select>
            </div>
            <div><label style={lbl}>Amount *</label><input style={inp} type="number" min="0" step="0.01" value={form.amount} onChange={e => set({ amount: e.target.value })} /></div>
            <div>
              <label style={lbl}>Currency *</label>
              <select style={inp} value={form.currency} onChange={e => set({ currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Public description *</label>
              <input style={inp} value={form.description} placeholder="Shown on the website, e.g. Venue hire, Career Clarity Fair 2026" onChange={e => set({ description: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={e => set({ category: e.target.value })}>
                <option value="">—</option>
                {LEDGER_CATEGORIES.map(c => <option key={c} value={c}>{humanise(c)}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Account</label><input style={inp} value={form.account_label} placeholder="e.g. Tide current account, GTBank NGN" onChange={e => set({ account_label: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Payer / payee and reference (directors only)</label>
              <input style={inp} value={form.counterparty} onChange={e => set({ counterparty: e.target.value })} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
              <input type="checkbox" checked={form.is_public} onChange={e => set({ is_public: e.target.checked })} /> Show on the public ledger
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
              <input type="checkbox" checked={form.is_transfer} onChange={e => set({ is_transfer: e.target.checked })} /> Transfer between our own accounts (left out of totals)
            </label>
            {editing && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
                <input type="checkbox" checked={form.excluded} onChange={e => set({ excluded: e.target.checked })} /> Exclude from the ledger and totals
              </label>
            )}
            {synced && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Reason for override *</label>
                <textarea style={{ ...inp, minHeight: 60 }} value={form.override_reason} onChange={e => set({ override_reason: e.target.value })} />
              </div>
            )}
          </div>

          {editing?.original && (
            <details style={{ marginBottom: 14, fontSize: '.8rem', color: '#4a5a4f' }}>
              <summary style={{ cursor: 'pointer' }}>Values originally reported by {SOURCE_LABELS[editing.source as LedgerSource]}</summary>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {Object.entries(editing.original).map(([k, v]) => <li key={k}>{humanise(k)}: {v === null || v === '' ? '—' : String(v)}</li>)}
              </ul>
              {editing.override_reason && <p style={{ margin: '6px 0 0' }}>Last override reason: {editing.override_reason}</p>}
            </details>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <div>{editing && editing.source === 'manual' && <button style={btn('#dc2626')} onClick={remove} disabled={busy}>Delete</button>}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn('#8a9a8f')} onClick={close} disabled={busy}>Cancel</button>
              <button style={btn('#1a3c2e')} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {totals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          {totals.map(t => (
            <div key={t.currency} style={{ padding: 14, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, fontSize: '.82rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.currency}, last {LEDGER_LIMIT} transactions</div>
              <div style={{ color: '#16a34a' }}>In {formatMoney(t.moneyIn, t.currency)}</div>
              <div style={{ color: '#dc2626' }}>Out {formatMoney(t.moneyOut, t.currency)}</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>Net {formatMoney(t.net, t.currency)}</div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
          No transactions yet. Connect a bank feed or add a manual entry.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d0ccc4', background: '#f5f3f0' }}>
                <th style={th}>Date</th><th style={th}>Description</th><th style={th}>Source</th><th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>Amount</th><th style={th}></th><th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #e8e4dc', opacity: e.excluded ? 0.5 : 1, textDecoration: e.excluded ? 'line-through' : undefined }}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtDate(e.occurred_on)}</td>
                  <td style={td}>
                    {e.description}
                    {e.counterparty && <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{e.counterparty}</div>}
                  </td>
                  <td style={td}>{SOURCE_LABELS[e.source as LedgerSource] ?? e.source}{e.account_label && e.account_label !== SOURCE_LABELS[e.source as LedgerSource] ? <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{e.account_label}</div> : null}</td>
                  <td style={td}>{e.category ? humanise(e.category) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', color: e.direction === 'in' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {e.direction === 'in' ? '+' : '−'}{formatMoney(e.amount, e.currency)}
                    {e.fee && Number(e.fee) > 0 && <div style={{ fontSize: '.72rem', color: '#8a9a8f', fontWeight: 400 }}>fee {formatMoney(e.fee, e.currency)}</div>}
                  </td>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                      {e.overridden && <Badge tone="amber">Overridden</Badge>}
                      {e.excluded && <Badge tone="red">Excluded</Badge>}
                      {!e.is_public && <Badge tone="grey">Private</Badge>}
                      {e.is_transfer && <Badge tone="grey">Transfer</Badge>}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button onClick={() => openEdit(e)} disabled={form !== null} style={{ background: 'none', border: 'none', color: '#0F2D1D', cursor: 'pointer', textDecoration: 'underline', fontSize: '.8rem' }}>
                      {e.source === 'manual' ? 'Edit' : 'Override'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
