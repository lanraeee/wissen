'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const mounted = useRef(false)

  // Initial page load — fires after React hydrates (DOMContentLoaded already past)
  useEffect(() => {
    const mountedAt = Date.now()
    const MIN_MS = 500

    const elapsed = Date.now() - mountedAt
    const delay = Math.max(0, MIN_MS - elapsed)

    const t1 = setTimeout(() => {
      setFading(true)
      const t2 = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(t2)
    }, delay)

    return () => clearTimeout(t1)
  }, [])

  // Route transitions — skip on initial mount
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setVisible(true)
    setFading(false)
    const t = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 400)
    }, 300)
    return () => clearTimeout(t)
  }, [pathname])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--green-800, #1a3c2e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.2rem',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.45s ease',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <circle cx="26" cy="26" r="22" stroke="rgba(244,240,231,0.15)" strokeWidth="3" />
        <circle
          cx="26" cy="26" r="22"
          stroke="#f4f0e7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="138"
          strokeDashoffset="104"
          style={{ animation: 'wh-spin 1s linear infinite', transformOrigin: 'center' }}
        />
      </svg>
      <span style={{
        fontFamily: 'var(--ff-display, serif)',
        fontSize: '0.8rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(244,240,231,0.6)',
      }}>
        Wissen-Haus
      </span>
      <style>{`@keyframes wh-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
