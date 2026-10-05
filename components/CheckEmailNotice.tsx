'use client'

import { useState } from 'react'

interface Props {
  email: string
  /** True when this follows a fresh sign-up, false when a sign-in was refused. */
  justSignedUp?: boolean
}

/** "Check your inbox" panel with a resend button, shown until the address is confirmed. */
export default function CheckEmailNotice({ email, justSignedUp = false }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function resend() {
    setStatus('sending')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ background: 'var(--green-50, #f0f5f1)', color: 'var(--green-800)', padding: '16px 18px', borderRadius: 'var(--radius)', fontSize: '.92rem', marginBottom: 20 }}>
      <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{justSignedUp ? 'Check your inbox' : 'Confirm your email to sign in'}</p>
      <p style={{ margin: '0 0 12px' }}>
        We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in. The link expires in 24 hours.
      </p>
      {status === 'sent' ? (
        <p style={{ margin: 0 }}>A new link is on its way.</p>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={status === 'sending'}
          style={{ color: 'var(--green-800)', fontWeight: 600, background: 'none', cursor: 'pointer', border: 'none', padding: 0, textDecoration: 'underline' }}
        >
          {status === 'sending' ? 'Sending…' : status === 'error' ? 'That didn’t work. Try again' : 'Send the link again'}
        </button>
      )}
    </div>
  )
}
