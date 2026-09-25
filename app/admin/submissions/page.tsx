'use client'

import { useState, useEffect, useCallback } from 'react'
import SubmissionActions from '@/components/admin/SubmissionActions'

const TYPES = ['contact', 'volunteer', 'partner', 'donation', 'bank_transfer']

const TYPE_LABELS: Record<string, string> = { bank_transfer: 'bank transfers' }

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending:  { background: '#fef3c7', color: '#92400e' },
  reviewed: { background: '#d1fae5', color: '#065f46' },
  actioned: { background: '#dbeafe', color: '#1e40af' },
}

interface Submission {
  id: string
  type: string
  name: string
  email: string
  data: Record<string, string>
  status: string
  created_at: string
}

function exportCSV(rows: Submission[], type: string) {
  if (!rows.length) return
  const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r.data))))
  const header = ['name', 'email', 'status', 'created_at', ...allKeys]
  const lines = [
    header.join(','),
    ...rows.map(r =>
      header.map(k => {
        const val = k === 'name' ? r.name : k === 'email' ? r.email : k === 'status' ? r.status : k === 'created_at' ? r.created_at : (r.data[k] ?? '')
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      }).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `submissions-${type}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function AdminSubmissions() {
  const [activeType, setActiveType] = useState('contact')
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resending, setResending] = useState<string | null>(null)
  const [resendMsg, setResendMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

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

  // Confirming a bank transfer is what turns a pledge into a real donation:
  // the API records it through the same path a card payment uses, so the donor
  // gets the identical receipt email and certificate.
  async function confirmTransfer(rowId: string, reference: string) {
    if (!confirm(`Confirm this transfer has landed in the account?\n\nThis records the donation and emails the donor their receipt and certificate.`)) return
    setResending(rowId); setResendMsg(null)
    try {
      const res = await fetch('/api/admin/bank-transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to confirm')
      setResendMsg({ id: rowId, text: data.alreadyConfirmed ? 'Already confirmed' : 'Confirmed â€” receipt sent', ok: true })
      await load()
    } catch (err) {
      setResendMsg({ id: rowId, text: err instanceof Error ? err.message : 'Failed to confirm', ok: false })
    }
    setResending(null)
  }

  async function cancelTransfer(rowId: string, reference: string) {
    if (!confirm('Mark this bank transfer as cancelled? The donor will see it as cancelled if they revisit their link.')) return
    setResending(rowId); setResendMsg(null)
    try {
      const res = await fetch('/api/admin/bank-transfers', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      setResendMsg({ id: rowId, text: 'Cancelled', ok: true })
      await load()
    } catch (err) {
      setResendMsg({ id: rowId, text: err instanceof Error ? err.message : 'Failed to cancel', ok: false })
    }
    setResending(null)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/submissions?type=${activeType}`)
    const data = await res.json()
    setRows(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [activeType])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r =>
    !search || `${r.name} ${r.email} ${JSON.stringify(r.data)}`.toLowerCase().includes(search.toLowerCase())
  )

  const counts: Record<string, number> = {}
  rows.forEach(r => { counts[r.status || 'pending'] = (counts[r.status || 'pending'] ?? 0) + 1 })

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="admin-page-title">Submissions</h1>
          <p className="admin-page-desc">
            {rows.length} records
            {Object.entries(counts).map(([s, n]) => (
              <span key={s} style={{ marginLeft: 10, ...STATUS_COLORS[s], borderRadius: 99, padding: '1px 8px', fontSize: '.72rem', fontWeight: 700 }}>{n} {s}</span>
            ))}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Searchâ€¦" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 180 }} />
          <button onClick={() => exportCSV(filtered, activeType)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: activeType === t ? '#1a3c2e' : '#fff',
            color: activeType === t ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc', cursor: 'pointer', textTransform: 'capitalize',
          }}>{TYPE_LABELS[t] ?? t}</button>
        ))}
      </div>

      {loading ? (
        <div className="admin-table-empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
              No {TYPE_LABELS[activeType] ?? activeType} submissions{search ? ' matching your search' : ' yet'}.
            </div>
          )}
          {filtered.map(row => {
            const sc = STATUS_COLORS[row.status || 'pending'] ?? STATUS_COLORS.pending
            return (
              <div key={row.id} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{row.name || row.email}</span>
                    {row.name && row.email && <span style={{ fontSize: '.83rem', color: '#8a9a8f', marginLeft: 8 }}>{row.email}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: '.7rem', fontWeight: 700, textTransform: 'capitalize' }}>{row.status || 'pending'}</span>
                    <span style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at).toLocaleString('en-GB')}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                  {Object.entries(row.data ?? {}).map(([k, v]) => v && (
                    <div key={k}>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>{k}</div>
                      <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                  {row.email && <a href={`mailto:${row.email}`} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>Reply â†’</a>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {resendMsg?.id === row.id && (
                      <span style={{ fontSize: '.78rem', color: resendMsg.ok ? '#16a34a' : '#dc2626' }}>{resendMsg.text}</span>
                    )}
                    {activeType === 'donation' && row.data?.reference && (
                      <button
                        onClick={() => resendReceipt(row.id, row.data.reference)}
                        disabled={resending === row.id}
                        style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', border: 'none', cursor: 'pointer', opacity: resending === row.id ? .6 : 1 }}
                      >
                        {resending === row.id ? 'Sendingâ€¦' : 'Resend Receipt'}
                      </button>
                    )}
                    {activeType === 'bank_transfer' && row.data?.reference && row.data?.status !== 'confirmed' && row.data?.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => confirmTransfer(row.id, row.data.reference)}
                          disabled={resending === row.id}
                          style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer', opacity: resending === row.id ? .6 : 1 }}
                        >
                          {resending === row.id ? 'Workingâ€¦' : 'âœ“ Confirm Received'}
                        </button>
                        <button
                          onClick={() => cancelTransfer(row.id, row.data.reference)}
                          disabled={resending === row.id}
                          style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#dc2626', border: 'none', cursor: 'pointer', opacity: resending === row.id ? .6 : 1 }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {activeType === 'bank_transfer' && row.data?.status === 'confirmed' && row.data?.cert_id && (
                      <a
                        href={`/donate/receipt/${row.data.cert_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '4px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#f0ece4', color: '#1a3c2e', textDecoration: 'none' }}
                      >
                        View Certificate â†—
                      </a>
                    )}
                    <SubmissionActions id={row.id} status={row.status || 'pending'} onRefresh={load} />
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
