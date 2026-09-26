'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLogoutButton({ style }: { style?: React.CSSProperties }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    setBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        font: 'inherit', color: 'inherit', opacity: busy ? .6 : 1,
        ...style,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
      </svg>
      {busy ? 'Logging out…' : 'Log out'}
    </button>
  )
}
