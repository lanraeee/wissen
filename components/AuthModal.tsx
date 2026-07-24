'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
  defaultTab?: 'login' | 'signup'
}

export default function AuthModal({ onClose, defaultTab = 'login' }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Login failed'); return }
    onClose()
    router.push('/community')
    router.refresh()
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fd.get('firstName'),
        lastName: fd.get('lastName'),
        email: fd.get('email'),
        password: fd.get('password')
      })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Signup failed'); return }
    onClose()
    router.push('/community')
    router.refresh()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,33,21,0.7)', backdropFilter: 'blur(4px)', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: 'clamp(28px,4vw,48px)', maxWidth: 480, width: '100%', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'none' }}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '1.1rem', color: tab === t ? 'var(--green-800)' : 'var(--ink-60)', borderBottom: tab === t ? '2px solid var(--red)' : '2px solid transparent', paddingBottom: '4px', background: 'none', cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {t === 'login' ? 'Log In' : 'Create Account'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-300)', borderRadius: 10, padding: '12px 16px', color: 'var(--red)', marginBottom: '1rem', fontSize: '.92rem' }}>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form className="form" onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" name="password" type="password" required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn--block" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '.9rem', color: 'var(--ink-60)', marginTop: '.5rem' }}>
              No account?{' '}
              <button type="button" onClick={() => setTab('signup')} style={{ color: 'var(--red)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>
                Sign up free
              </button>
            </p>
          </form>
        ) : (
          <form className="form" onSubmit={handleSignup}>
            <div className="form-row">
              <div className="field">
                <label htmlFor="su-first">First Name</label>
                <input id="su-first" name="firstName" required placeholder="Ada" />
              </div>
              <div className="field">
                <label htmlFor="su-last">Last Name</label>
                <input id="su-last" name="lastName" required placeholder="Lovelace" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="su-email">Email</label>
              <input id="su-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="su-password">Password <span style={{ color: 'var(--ink-60)', fontWeight: 400 }}>(min 8 chars)</span></label>
              <input id="su-password" name="password" type="password" required minLength={8} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn--block" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '.9rem', color: 'var(--ink-60)', marginTop: '.5rem' }}>
              Already have one?{' '}
              <button type="button" onClick={() => setTab('login')} style={{ color: 'var(--red)', fontWeight: 600, background: 'none', cursor: 'pointer' }}>
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
