'use client'

import { useState } from 'react'

export default function TicketAccessForm({ reference }: { reference: string }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(reference)}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      // The server answers the same way whether or not the address matched, so
      // there is nothing here to branch on -- and nothing to leak.
      setSent(data.message ?? 'If that address matches this conversation, we have emailed a link to open it.')
    } catch {
      setSent('Could not reach us just now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div style={{ background: 'var(--green-50, #f2f8f4)', border: '1px solid var(--green-100, #d9ebe0)', borderRadius: 12, padding: 24 }}>
        <p style={{ margin: 0 }}>{sent}</p>
        <p style={{ margin: '10px 0 0', fontSize: '.85rem', color: '#6b7a70' }}>
          The link works for 30 minutes. Check your spam folder if it doesn&apos;t arrive.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      <label>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', marginBottom: 5 }}>
          Email address on this conversation
        </span>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={200}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '.92rem',
            border: '1px solid var(--line, #e8e4dc)', borderRadius: 8, fontFamily: 'inherit', outline: 'none',
          }}
        />
      </label>
      <div>
        <button type="submit" className="btn" disabled={busy || !email.trim()}>
          {busy ? 'Sending…' : 'Email me a link'}
        </button>
      </div>
    </form>
  )
}
