'use client'

import { useState } from 'react'
import Link from 'next/link'
import VoiceRecorder from './VoiceRecorder'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '.92rem', boxSizing: 'border-box',
  border: '1px solid var(--line, #e8e4dc)', borderRadius: 8, fontFamily: 'inherit', outline: 'none',
}

export default function SupportTicketForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [audioId, setAudioId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState<string | null>(null)
  const [lookup, setLookup] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || null, subject, message, audioId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not send that. Please try again.'); return }
      setReference(data.reference)
    } catch {
      setError('Could not reach us just now. Please check your connection.')
    } finally {
      setBusy(false)
    }
  }

  if (reference) {
    return (
      <div style={{ background: 'var(--green-50, #f2f8f4)', border: '1px solid var(--green-100, #d9ebe0)', borderRadius: 12, padding: 28 }}>
        <h2 style={{ marginTop: 0 }}>We&apos;ve got your message.</h2>
        <p>Your reference is:</p>
        <p style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '.04em' }}>{reference}</p>
        <p style={{ fontSize: '.9rem' }}>
          Keep it somewhere safe — anyone who has it can read this conversation.
          {email ? ' We’ve also emailed it to you.' : ''}
        </p>
        <Link href={`/support/${encodeURIComponent(reference)}`} className="btn">View your ticket</Link>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label>
            <span style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', marginBottom: 5 }}>Your name *</span>
            <input value={name} onChange={e => setName(e.target.value)} required maxLength={120} style={inputStyle} />
          </label>
          <label>
            <span style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', marginBottom: 5 }}>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} style={inputStyle} />
            <span style={{ fontSize: '.74rem', color: '#6b7a70' }}>Optional — but it&apos;s how we reply fastest.</span>
          </label>
        </div>

        <label>
          <span style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', marginBottom: 5 }}>Subject *</span>
          <input value={subject} onChange={e => setSubject(e.target.value)} required maxLength={200} style={inputStyle} />
        </label>

        <label>
          <span style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', marginBottom: 5 }}>Message *</span>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} maxLength={5000} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <div>
          <VoiceRecorder
            disabled={busy}
            onRecorded={({ audioId: id, transcript }) => {
              setAudioId(id)
              // The transcript is a convenience, not a replacement: it drops
              // into the box so the sender can correct it before sending, and
              // the audio goes along regardless.
              setMessage(m => (m ? `${m}\n\n${transcript}` : transcript).trim())
              if (!subject) setSubject((transcript || 'Voice note').slice(0, 80))
            }}
          />
          {audioId && <p style={{ fontSize: '.78rem', color: '#1a6b3c', marginTop: 6 }}>Voice note attached ✓</p>}
        </div>

        {error && <p style={{ color: '#a33', fontSize: '.86rem' }}>{error}</p>}

        <div>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 36, borderTop: '1px solid var(--line, #e8e4dc)', paddingTop: 22 }}>
        <h2 style={{ fontSize: '1.05rem' }}>Already have a reference?</h2>
        <form
          onSubmit={e => { e.preventDefault(); if (lookup.trim()) window.location.href = `/support/${encodeURIComponent(lookup.trim())}` }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}
        >
          <input
            value={lookup}
            onChange={e => setLookup(e.target.value)}
            placeholder="WH-XXXXX-XXXXX"
            style={{ ...inputStyle, width: 'auto', flex: '1 1 220px', fontFamily: 'monospace' }}
          />
          <button type="submit" className="btn btn--ghost">Find my ticket</button>
        </form>
      </div>
    </>
  )
}
