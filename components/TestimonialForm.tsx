'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Me { user: { name: string } | null }

export default function TestimonialForm() {
  const [me, setMe] = useState<Me['user']>(null)
  const [checked, setChecked] = useState(false)
  const [role, setRole] = useState('')
  const [quote, setQuote] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : { user: null })
      .then(d => setMe(d.user))
      .catch(() => setMe(null))
      .finally(() => setChecked(true))
  }, [])

  async function submit() {
    if (!quote.trim()) { setError('Please share a few words about your experience.'); return }
    setPosting(true); setError('')
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote, role }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setPosting(false); return }
    setDone(true); setPosting(false)
  }

  if (!checked) return null

  if (done) {
    return (
      <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--green-800)' }}>Thank you for sharing your story!</p>
        <p style={{ margin: '.4rem 0 0', color: 'var(--ink-60)', fontSize: '.9rem' }}>It&#39;s in review and will appear on our homepage once approved.</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--ink-60)' }}>
          <Link href="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Log in</Link> to share your impact story with the community.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-60)', display: 'block', marginBottom: 4 }}>Your Story *</label>
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            placeholder="How has Wissen-Haus helped you? What changed for you?"
            rows={4}
            maxLength={1000}
            style={{ width: '100%', padding: '9px 12px', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: 8, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ fontSize: '.72rem', color: 'var(--ink-60)', textAlign: 'right', marginTop: 2 }}>{quote.length}/1000</div>
        </div>
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-60)', display: 'block', marginBottom: 4 }}>Role / Title (optional)</label>
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. SS3 Student, Scholarship Recipient"
            maxLength={100}
            style={{ width: '100%', padding: '9px 12px', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        {error && <p style={{ margin: 0, color: '#dc2626', fontSize: '.82rem' }}>{error}</p>}
        <button onClick={submit} disabled={posting || !quote.trim()} className="btn" style={{ opacity: posting ? 0.7 : 1, alignSelf: 'flex-start' }}>
          {posting ? 'Sharing…' : 'Share Your Story'}
        </button>
      </div>
    </div>
  )
}
