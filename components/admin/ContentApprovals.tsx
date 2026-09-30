'use client'

import { useState, useEffect, useCallback } from 'react'

type Request = {
  id: string
  content_key: string
  proposed_value: unknown
  previous_value: unknown
  status: 'pending' | 'approved' | 'rejected'
  requested_by_email: string
  requested_at: string
  reviewed_by_email: string | null
  reviewed_at: string | null
  review_note: string | null
}

const STATUS_COLOURS: Record<string, string> = {
  pending: '#b8860b',
  approved: '#1a6b3c',
  rejected: '#a33',
}

function pretty(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function ContentApprovals({ canReview }: { canReview: boolean }) {
  const [requests, setRequests] = useState<Request[]>([])
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content-approvals?status=${filter}`)
      const data = await res.json()
      setRequests(data.requests ?? [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/content-approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not complete that action')
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
            background: filter === f ? '#1a3c2e' : '#fff',
            color: filter === f ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc',
          }}>{f === 'pending' ? 'Awaiting review' : 'All'}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fdecea', color: '#a33', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '.86rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="admin-page-desc">Loading…</p>
      ) : requests.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <p className="admin-page-desc" style={{ margin: 0 }}>
            {filter === 'pending' ? 'Nothing is waiting for review.' : 'No content changes have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {requests.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <code style={{ fontWeight: 700, fontSize: '.88rem' }}>{r.content_key}</code>
                <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: STATUS_COLOURS[r.status] }}>
                  {r.status}
                </span>
                <span style={{ fontSize: '.8rem', color: '#6b7a70', marginLeft: 'auto' }}>
                  {r.requested_by_email} · {new Date(r.requested_at).toLocaleString()}
                </span>
              </div>

              {r.reviewed_by_email && (
                <div style={{ fontSize: '.78rem', color: '#6b7a70', marginTop: 6 }}>
                  Reviewed by {r.reviewed_by_email}
                  {r.reviewed_at ? ` on ${new Date(r.reviewed_at).toLocaleString()}` : ''}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button onClick={() => setOpenId(openId === r.id ? null : r.id)} style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid #e8e4dc', background: '#fff',
                  fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {openId === r.id ? 'Hide changes' : 'View changes'}
                </button>

                {canReview && r.status === 'pending' && (
                  <>
                    <button onClick={() => review(r.id, 'approve')} disabled={busyId === r.id} style={{
                      padding: '6px 16px', borderRadius: 6, border: 'none', background: '#1a6b3c', color: '#fff',
                      fontSize: '.82rem', fontWeight: 700, cursor: busyId === r.id ? 'wait' : 'pointer',
                    }}>
                      {busyId === r.id ? 'Publishing…' : 'Approve and publish'}
                    </button>
                    <button onClick={() => review(r.id, 'reject')} disabled={busyId === r.id} style={{
                      padding: '6px 16px', borderRadius: 6, border: '1px solid #e8e4dc', background: '#fff',
                      color: '#a33', fontSize: '.82rem', fontWeight: 600, cursor: busyId === r.id ? 'wait' : 'pointer',
                    }}>
                      Reject
                    </button>
                  </>
                )}
              </div>

              {openId === r.id && (
                <div style={{ display: 'grid', gap: 12, marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  <div>
                    <div style={{ fontSize: '.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7a70', marginBottom: 6 }}>Currently live</div>
                    <pre style={{ background: '#f7f5f0', padding: 12, borderRadius: 8, fontSize: '.74rem', overflowX: 'auto', maxHeight: 340, margin: 0 }}>
                      {pretty(r.previous_value)}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: '.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#1a6b3c', marginBottom: 6 }}>Proposed</div>
                    <pre style={{ background: '#f2f8f4', padding: 12, borderRadius: 8, fontSize: '.74rem', overflowX: 'auto', maxHeight: 340, margin: 0 }}>
                      {pretty(r.proposed_value)}
                    </pre>
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
