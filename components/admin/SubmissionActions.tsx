'use client'

import { useState } from 'react'

const btn = (bg: string, color = '#fff') => ({
  padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
})

export default function SubmissionActions({
  id, status, onRefresh,
}: { id: string; status: string; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false)

  async function setStatus(s: string) {
    setBusy(true)
    await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    })
    setBusy(false)
    onRefresh()
  }

  async function del() {
    if (!confirm('Delete this submission?')) return
    setBusy(true)
    await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' })
    setBusy(false)
    onRefresh()
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
      {status !== 'reviewed' && (
        <button style={btn('#1a3c2e')} onClick={() => setStatus('reviewed')} disabled={busy}>Mark Reviewed</button>
      )}
      {status !== 'pending' && (
        <button style={btn('#e8e4dc', '#3a4a3f')} onClick={() => setStatus('pending')} disabled={busy}>Mark Pending</button>
      )}
      {status !== 'actioned' && (
        <button style={btn('#1d4ed8')} onClick={() => setStatus('actioned')} disabled={busy}>Mark Actioned</button>
      )}
      <button style={btn('#dc2626')} onClick={del} disabled={busy}>Delete</button>
    </div>
  )
}
