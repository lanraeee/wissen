'use client'

import { useState, useEffect, useCallback } from 'react'

interface Donation {
  id: string
  name: string
  email: string
  amount: number
  currency: string
  reference: string
  provider: string
  cert_id: string | null
  created_at: string
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function exportCSV(rows: Donation[]) {
  if (!rows.length) return
  const header = ['name', 'email', 'amount', 'currency', 'reference', 'provider', 'cert_id', 'created_at']
  const lines = [
    header.join(','),
    ...rows.map(r => header.map(k => `"${String((r as unknown as Record<string, unknown>)[k] ?? '').replace(/"/g, '""')}"`).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function AdminDonations() {
  const [rows, setRows] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resending, setResending] = useState<string | null>(null)
  const [resendMsg, setResendMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/donations')
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function resendReceipt(rowId: string, reference: string) {
    setResending(rowId); setResendMsg(null)
    try {
      const res = await fetch('/api/admin/donations/resend-receipt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend')
      setResendMsg({ id: rowId, text: `Sent to ${data.sentTo}`, ok: true })
    } catch (err) {
      setResendMsg({ id: rowId, text: err instanceof Error ? err.message : 'Failed to resend', ok: false })
    }
    setResending(null)
  }

  const filtered = rows.filter(r =>
    !search || `${r.name} ${r.email} ${r.reference} ${r.provider}`.toLowerCase().includes(search.toLowerCase())
  )
  const total = filtered.reduce((sum, r) => sum + Number(r.amount), 0)

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="admin-page-title">Donations</h1>
          <p className="admin-page-desc">{rows.length} gifts recorded</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 180 }} />
          <button onClick={() => exportCSV(filtered)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-table-empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No donations yet{search ? ' matching your search' : ''}.
            </div>
          )}
          {filtered.map(row => (
            <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.name}</span>
                  <span style={{ fontSize: '.83rem', color: '#8a9a8f', marginLeft: 8 }}>{row.email}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ background: '#f0ece4', borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700 }}>{row.provider}</span>
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
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                {row.cert_id ? (
                  <a href={`/donate/receipt/${row.cert_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>
                    View Certificate ↗
                  </a>
                ) : <span />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {resendMsg?.id === row.id && (
                    <span style={{ fontSize: '.78rem', color: resendMsg.ok ? '#16a34a' : '#dc2626' }}>{resendMsg.text}</span>
                  )}
                  <button
                    onClick={() => resendReceipt(row.id, row.reference)}
                    disabled={resending === row.id}
                    style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer', opacity: resending === row.id ? .6 : 1 }}
                  >
                    {resending === row.id ? 'Sending…' : 'Resend Receipt'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length > 0 && (
            <div style={{ textAlign: 'right', fontSize: '.82rem', color: '#8a9a8f', padding: '4px 8px' }}>
              Total shown: <strong style={{ color: '#1a2e24' }}>{filtered.length === rows.length ? '' : '(filtered) '}{total.toLocaleString('en-NG')}</strong>
            </div>
          )}
        </div>
      )}
    </>
  )
}
