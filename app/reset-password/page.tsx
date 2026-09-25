'use client'



import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import Image from 'next/image'



export default function ResetPasswordPage() {

  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)

  const [password, setPassword] = useState('')

  const [confirm, setConfirm] = useState('')

  const [showPw, setShowPw] = useState(false)

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const [error, setError] = useState('')



  useEffect(() => {

    setToken(new URLSearchParams(window.location.search).get('token'))

  }, [])



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    e.preventDefault()

    setError('')

    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    if (password !== confirm) { setError('Passwords do not match'); return }

    if (!token) { setError('Missing or invalid reset link'); return }



    setStatus('loading')

    try {

      const res = await fetch('/api/auth/reset-password', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ token, password }),

      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      setStatus('done')

      setTimeout(() => { router.push('/login?mode=login') }, 2500)

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

              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 12, color: 'var(--green-800)' }}>Password updated</h1>

              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.95rem' }}>Redirecting you to sign in…</p>

            </>

          ) : token === null ? (

            <p style={{ textAlign: 'center', color: 'var(--ink-60)' }}>Loading…</p>

          ) : !token ? (

            <>

              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 12, color: 'var(--green-800)' }}>Invalid reset link</h1>

              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.92rem' }}>

                This link is missing its reset token. Please request a new one.

              </p>

              <div style={{ textAlign: 'center', marginTop: 24 }}>

                <Link href="/forgot-password" style={{ color: 'var(--green-800)', fontSize: '.9rem', fontWeight: 600 }}>Request a new link →</Link>

              </div>

            </>

          ) : (

            <>

              <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 8, color: 'var(--green-800)' }}>Choose a new password</h1>

              <p style={{ textAlign: 'center', color: 'var(--ink-60)', fontSize: '.92rem', marginBottom: 24 }}>

                Enter and confirm your new password below.

              </p>



              {error && (

                <div style={{ background: '#fee', color: '#c33', padding: '12px 14px', borderRadius: 'var(--radius)', fontSize: '.9rem', marginBottom: 20 }}>{error}</div>

              )}



              <form className="form" onSubmit={handleSubmit}>

                <div className="field">

                  <label htmlFor="rp-pw">New Password <span style={{ color: 'var(--ink-60)', fontWeight: 400 }}>(min 8 chars)</span></label>

                  <div style={{ position: 'relative' }}>

                    <input id="rp-pw" type={showPw ? 'text' : 'password'} required minLength={8} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />

                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--ink-60)', fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>

                      {showPw ? '🙈' : '👁️'}

                    </button>

                  </div>

                </div>

                <div className="field">

                  <label htmlFor="rp-confirm">Confirm Password</label>

                  <input id="rp-confirm" type={showPw ? 'text' : 'password'} required minLength={8} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />

                </div>

                <button type="submit" className="btn btn--block" disabled={status === 'loading'} style={{ marginTop: 8 }}>

                  {status === 'loading' ? 'Updating…' : 'Update password'}

                </button>

              </form>

            </>

          )}

        </div>

      </div>

    </div>

  )

}

