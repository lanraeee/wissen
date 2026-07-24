'use client'

import { useState, FormEvent } from 'react'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          subject: fd.get('subject'),
          message: fd.get('message'),
        }),
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

  if (status === 'done') {
    return (
      <div className="feature form reveal" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-800,#1a3c2e)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        <h3 style={{ marginTop: '1rem' }}>Message sent!</h3>
        <p style={{ color: 'var(--ink-60)', marginTop: '.5rem' }}>Thanks for reaching out. We&apos;ll be in touch within 2 business days.</p>
      </div>
    )
  }

  return (
    <form className="feature form reveal" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '1.2rem' }}>Send a Message</h3>
      <div className="form-row">
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required placeholder="Your name" />
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required placeholder="you@example.com" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-subject">Subject</label>
        <input id="c-subject" name="subject" required placeholder="How can we help?" />
      </div>
      <div className="field">
        <label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" name="message" required placeholder="Tell us more…" />
      </div>
      {status === 'error' && <p style={{ color: '#c0392b', fontSize: '.875rem', margin: '-.5rem 0 .75rem' }}>{error}</p>}
      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
