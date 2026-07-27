'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function PageLoader() {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Initial load: dismiss after 600ms
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const t = setTimeout(() => el.classList.add('wh-out'), 600)
    return () => clearTimeout(t)
  }, [])

  // Route change: reset then dismiss after 300ms
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('wh-out')
    const t = setTimeout(() => el.classList.add('wh-out'), 300)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div ref={ref} className="wh-loader" aria-hidden="true">
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
      <style>{`
        .wh-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--green-800, #1a3c2e);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 1.2rem;
          opacity: 1;
          pointer-events: all;
          transition: opacity 0.45s ease, visibility 0s linear 0.45s;
          /* CSS fallback: if JS bundle is slow, auto-dismiss after 5s */
          animation: wh-auto-out 5s ease forwards;
        }
        .wh-loader.wh-out {
          opacity: 0;
          pointer-events: none;
          visibility: hidden;
          transition: opacity 0.45s ease, visibility 0s linear 0.45s;
          animation: none;
        }
        @keyframes wh-auto-out {
          0%, 70% { opacity: 1; pointer-events: all; }
          100% { opacity: 0; pointer-events: none; visibility: hidden; }
        }
        @keyframes wh-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
