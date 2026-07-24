'use client'

import { useState } from 'react'

export default function OpportunityRowActions({ id, onRefresh }: { id: string; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false)

  async function del() {
    if (!confirm('Delete this opportunity?')) return
    setBusy(true)
    await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' })
    setBusy(false)
    onRefresh()
  }

  return (
    <button onClick={del} disabled={busy} style={{
      padding: '3px 8px', borderRadius: 5, fontSize: '.7rem', fontWeight: 600,
      background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer',
    }}>
      Delete
    </button>
  )
}
