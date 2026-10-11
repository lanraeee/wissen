'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Shown above every member page while a support "view as member" session is
// live, so the admin can never mistake it for their own account. Reads only the
// display cookie. The real access check is server-side, so a wrong or missing
// value here changes what is shown, not what is allowed.

interface Meta { name: string; expiresAt: string }

function readMeta(): Meta | null {
  try {
    const raw = document.cookie.split('; ').find(c => c.startsWith('wh_view_as_meta='))
    if (!raw) return null
    const parsed = JSON.parse(decodeURIComponent(raw.slice('wh_view_as_meta='.length)))
    if (typeof parsed?.name !== 'string' || typeof parsed?.expiresAt !== 'string') return null
    return parsed as Meta
  } catch {
    return null
  }
}

export default function ViewAsBanner() {
  const pathname = usePathname()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    setMeta(readMeta())
    const tick = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(tick)
  }, [pathname])

  if (!meta) return null
  const expires = new Date(meta.expiresAt).getTime()
  if (!(expires > now)) return null

  const minutesLeft = Math.max(1, Math.ceil((expires - now) / 60_000))
  const until = new Date(expires).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  async function exit() {
    setExiting(true)
    try {
      await fetch('/api/view-as/exit', { method: 'POST' })
    } finally {
      window.location.assign('/admin/users')
    }
  }

  return (
    <div
      role="status"
      style={{
        position: 'sticky', top: 0, zIndex: 1000, background: '#7c2d12', color: '#fff',
        padding: '8px 16px', fontSize: '.85rem', display: 'flex', gap: 12,
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
      }}
    >
      <span>
        <strong>Viewing as {meta.name}</strong> · read-only · ends at {until} ({minutesLeft} min left)
      </span>
      <button
        onClick={exit}
        disabled={exiting}
        style={{
          background: '#fff', color: '#7c2d12', border: 'none', borderRadius: 6,
          padding: '4px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '.8rem',
        }}
      >
        {exiting ? 'Exiting…' : 'Exit view'}
      </button>
    </div>
  )
}
