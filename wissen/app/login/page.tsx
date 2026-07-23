'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'signup' | 'login'>(searchParams.get('mode') === 'login' ? 'login' : 'signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Login failed'); return }
    router.push('/community')
    router.refresh()
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: fd.get('firstName'), lastName: fd.get('lastName'), email: fd.get('email'), password: fd.get('password') })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Signup failed'); return }
    router.push('/community')
    router.refresh()
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--green-800) 0%, var(--green-900) 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'clamp(36px,5vw,60px) clamp(24px,5vw,40px)', boxShadow: '0 20px 60px rgba(15,45,29,.3)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link href="/">
              <Image src="/img/logo.png" alt="Wissen-Haus" width={120} height={120} style={{ margin: '0 auto 8px' }} />
            </Link>
            <p style={{ color: 'var(--ink-60)', margin: 0, fontSize: '.95rem', fontWeight: 700 }}>&ldquo;Empower Your Future&rdquo;</p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
            <button onClick={() => { setTab('signup'); setError('') }} style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '1.1rem', color: tab === 'signup' ? 'var(--green-800)' : 'var(--ink-60)', borderBottom: tab === 'signup' ? '2px solid var(--red)' : '2px solid transparent', paddingBottom: 4, background: 'none', cursor: 'pointer' }}>Create Account</button>
            <button onClick={() => { setTab('login'); setError('') }} style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '1.1rem', color: tab === 'login' ? 'var(--green-800)' : 'var(--ink-60)', borderBottom: tab === 'login' ? '2px solid var(--red)' : '2px solid transparent', paddingBottom: 4, background: 'none', cursor: 'pointer' }}>Sign In</button>
          </div>

          {error && (
            <div style={{ background: '#fee', color: '#c33', padding: '12px 14px', borderRadius: 'var(--radius)', fontSize: '.9rem', marginBottom: 20 }}>{error}</div>
          )}

          {tab === 'signup' ? (
            <form className="form" onSubmit={handleSignup}>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="su-first">First Name</label>
                  <input id="su-first" name="firstName" required placeholder="First name" />
                </div>
                <div className="field">
                  <label htmlFor="su-last">Last Name</label>
                  <input id="su-last" name="lastName" required placeholder="Last name" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="su-email">Email</label>
                <input id="su-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="field">
                <label htmlFor="su-pw">Password <span style={{ color: 'var(--ink-60)', fontWeight: 400 }}>(min 8 chars)</span></label>
                <div style={{ position: 'relative' }}>
                  <input id="su-pw" name="password" type={showPw ? 'text' : 'password'} required minLength={8} placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--ink-60)', fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn--block" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', color: 'var(--ink-60)', fontSize: '.9rem' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} style={{ color: 'var(--green-800)', fontWeight: 600, background: 'none', cursor: 'pointer', border: 'none' }}>Sign In</button>
              </div>
            </form>
          ) : (
            <form className="form" onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="li-email">Email</label>
                <input id="li-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="field">
                <label htmlFor="li-pw">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="li-pw" name="password" type={showPw ? 'text' : 'password'} required placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--ink-60)', fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn--block" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', color: 'var(--ink-60)', fontSize: '.9rem' }}>
                Don&#39;t have an account?{' '}
                <button type="button" onClick={() => setTab('signup')} style={{ color: 'var(--green-800)', fontWeight: 600, background: 'none', cursor: 'pointer', border: 'none' }}>Sign Up</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link href="/" style={{ color: 'var(--green-800)', fontSize: '.85rem' }}>← Back to Home</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--green-800), var(--green-900))' }} />}>
      <LoginForm />
    </Suspense>
  )
}
