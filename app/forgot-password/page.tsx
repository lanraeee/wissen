'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong')
      }
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--green-800) 0%, var(--green-900) 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'clamp(36px,5vw,60px) clamp(24px,5vw,40px)', boxShadow: '0 20px 60px rgba(15,45,29,.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/">
              <Image src="/img/logo.png" alt="Wissen-Haus" width={100} height={100} style={{ margin: '0 auto 8px' }} />
            </Link>
          </div>

          {status === 'done' ? (
            <>
              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 12, color: 'var(--green-800)' }}>Check your email</h1>
              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.95rem', lineHeight: 1.6 }}>
                If an account exists for <strong>{email}</strong>, we&#39;ve sent a link to reset your password. It expires in 1 hour.
              </p>
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Link href="/login?mode=login" style={{ color: 'var(--green-800)', fontSize: '.9rem', fontWeight: 600 }}>â† Back to Sign In</Link>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 8, color: 'var(--green-800)' }}>Forgot your password?</h1>
              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.92rem', marginBottom: 24 }}>
                Enter your email and we&#39;ll send you a link to reset it.
              </p>

              {error && (
                <div style={{ background: '#fee', color: '#c33', padding: '12px 14px', borderRadius: 'var(--radius)', fontSize: '.9rem', marginBottom: 20 }}>{error}</div>
              )}

              <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="fp-email">Email</label>
                  <input id="fp-email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn btn--block" disabled={status === 'loading'} style={{ marginTop: 8 }}>
                  {status === 'loading' ? 'Sendingâ€¦' : 'Send reset link'}
                </button>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <Link href="/login?mode=login" style={{ color: 'var(--green-800)', fontSize: '.85rem' }}>â† Back to Sign In</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
