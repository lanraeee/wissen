'use client'

import { useState, useEffect, useCallback } from 'react'

interface Pledge {
  id: string
  name: string
  email: string
  amount: number
  currency: string
  message: string | null
  reference: string
  status: 'awaiting_transfer' | 'declared_sent' | 'confirmed' | 'cancelled'
  cert_id: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  awaiting_transfer: { background: '#fef3c7', color: '#92400e' },
  declared_sent:      { background: '#dbeafe', color: '#1e40af' },
  confirmed:          { background: '#d1fae5', color: '#065f46' },
  cancelled:          { background: '#f0ece4', color: '#6b6b5c' },
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_transfer: 'Awaiting Transfer',
  declared_sent: 'Sender Says Sent',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export default function AdminBankTransfers() {
  const [rows, setRows] = useState<Pledge[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/bank-transfers')
    const data = await res.json()
    setRows(Array.isArray(data.pledges) ? data.pledges : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function confirmTransfer(rowId: string, reference: string) {
    if (!confirm('Confirm this transfer has landed in the account?\n\nThis records the donation and emails the donor their receipt and certificate.')) return
    setBusy(rowId); setMsg(null)
    try {
      const res = await fetch('/api/admin/bank-transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to confirm')
      setMsg({ id: rowId, text: data.alreadyConfirmed ? 'Already confirmed' : 'Confirmed — receipt sent', ok: true })
      await load()
    } catch (err) {
      setMsg({ id: rowId, text: err instanceof Error ? err.message : 'Failed to confirm', ok: false })
    }
    setBusy(null)
  }

  async function cancelTransfer(rowId: string, reference: string) {
    if (!confirm('Mark this bank transfer as cancelled? The donor will see it as cancelled if they revisit their link.')) return
    setBusy(rowId); setMsg(null)
    try {
      const res = await fetch('/api/admin/bank-transfers', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      setMsg({ id: rowId, text: 'Cancelled', ok: true })
      await load()
    } catch (err) {
      setMsg({ id: rowId, text: err instanceof Error ? err.message : 'Failed to cancel', ok: false })
    }
    setBusy(null)
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="admin-page-title">Bank Transfers</h1>
        <p className="admin-page-desc">{rows.length} pledges</p>
      </div>

      {loading ? (
        <div className="admin-table-empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No bank transfer pledges yet.
            </div>
          )}
          {rows.map(row => {
            const sc = STATUS_COLORS[row.status] ?? STATUS_COLORS.awaiting_transfer
            return (
              <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.name}</span>
                    <span style={{ fontSize: '.83rem', color: '#8a9a8f', marginLeft: 8 }}>{row.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: '.7rem', fontWeight: 700 }}>{STATUS_LABELS[row.status]}</span>
                    <span style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at).toLocaleString('en-GB')}</span>
                  </div>
                </div>
                <div className="rgrid-2" style={{ gap: '8px 24px' }}>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Amount</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a2e24' }}>{formatMoney(Number(row.amount), row.currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Reference</div>
                    <div style={{ fontSize: '.85rem', fontFamily: 'monospace', color: '#1a2e24' }}>{row.reference}</div>
                  </div>
                  {row.message && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>Message</div>
                      <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap' }}>{row.message}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                  {row.status === 'confirmed' && row.cert_id ? (
                    <a href={`/donate/receipt/${row.cert_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>
                      View Certificate ↗
                    </a>
                  ) : <span />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {msg?.id === row.id && <span style={{ fontSize: '.78rem', color: msg.ok ? '#16a34a' : '#dc2626' }}>{msg.text}</span>}
                    {row.status !== 'confirmed' && row.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => confirmTransfer(row.id, row.reference)}
                          disabled={busy === row.id}
                          style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: busy === row.id ? .6 : 1 }}
                        >
                          {busy === row.id ? 'Working…' : '✓ Confirm Received'}
                        </button>
                        <button
                          onClick={() => cancelTransfer(row.id, row.reference)}
                          disabled={busy === row.id}
                          style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#dc2626', border: 'none', cursor: 'pointer', opacity: busy === row.id ? .6 : 1 }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
