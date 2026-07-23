'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StreakBadge() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ streak: number; user: { name: string; email: string } } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setData({ streak: d.streak, user: d.user })
    }).catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (!data) return null

  return (
    <>
      <button
        id="streakBadge"
        aria-label={`${data.streak}-day streak. Click for details`}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', right: 22, bottom: 80, zIndex: 90,
          background: 'var(--green-800)', color: '#fff',
          borderRadius: 18, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: 'var(--shadow)', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: '.95rem',
          transition: 'transform .3s var(--ease)',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🔥</span>
        <span>{data.streak}</span>
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,33,21,0.7)', backdropFilter: 'blur(4px)', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: 'clamp(28px,4vw,40px)', maxWidth: 400, width: '100%', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', background: 'none', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            </button>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🔥</div>
            <h3 style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '2.8rem', color: 'var(--red)', lineHeight: 1, marginBottom: '0.3rem' }}>{data.streak}</h3>
            <p style={{ color: 'var(--ink-60)', marginBottom: '1.5rem' }}>day streak</p>
            <p style={{ fontWeight: 600, color: 'var(--green-800)', marginBottom: '0.3rem' }}>{data.user.name}</p>
            <p style={{ color: 'var(--ink-60)', fontSize: '.9rem', marginBottom: '2rem' }}>{data.user.email}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/profile" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>My Profile</a>
              <button className="btn btn--sm" style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }} onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
