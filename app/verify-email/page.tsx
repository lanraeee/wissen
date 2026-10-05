'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    // Strict Mode runs effects twice in development; the token is single-use.
    if (started.current) return
    started.current = true

    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setError('This link is missing its confirmation code.')
      setStatus('error')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Something went wrong')
        setStatus('done')
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setStatus('error')
      })
  }, [])

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--green-800) 0%, var(--green-900) 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'clamp(36px,5vw,60px) clamp(24px,5vw,40px)', boxShadow: '0 20px 60px rgba(15,45,29,.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/">
              <Image src="/img/logo.png" alt="Wissen-Haus" width={100} height={100} style={{ margin: '0 auto 8px' }} />
            </Link>
          </div>

          {status === 'loading' ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-60)' }}>Confirming your email…</p>
          ) : status === 'done' ? (
            <>
              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 12, color: 'var(--green-800)' }}>Email confirmed</h1>
              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.95rem' }}>Your account is ready. Sign in to get started.</p>
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Link href="/login?mode=login" className="btn">Sign in →</Link>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 12, color: 'var(--green-800)' }}>Link not valid</h1>
              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.92rem' }}>
                {error} If your account is already confirmed, just sign in. Otherwise, signing in will offer to send a fresh link.
              </p>
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Link href="/login?mode=login" style={{ color: 'var(--green-800)', fontSize: '.9rem', fontWeight: 600 }}>Go to sign in →</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
