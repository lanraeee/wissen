'use client'

import { useState } from 'react'

export default function RevokeCert({ id, name }: { id: string; name: string }) {
  const [busy, setBusy] = useState(false)

  async function revoke() {
    if (!confirm(`Revoke certificate for ${name}? This cannot be undone.`)) return
    setBusy(true)
    await fetch(`/api/admin/certificates/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <button onClick={revoke} disabled={busy} style={{
      padding: '3px 8px', borderRadius: 5, fontSize: '.7rem', fontWeight: 600,
      background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer',
    }}>
      {busy ? '…' : 'Revoke'}
    </button>
  )
}
