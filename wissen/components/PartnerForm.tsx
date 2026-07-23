'use client'

import { useState, FormEvent } from 'react'

export default function PartnerForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          organisation: fd.get('org') || '',
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
      <div className="form" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-800,#1a3c2e)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        <h3 style={{ marginTop: '1rem' }}>Enquiry received!</h3>
        <p style={{ color: 'var(--ink-60)', marginTop: '.5rem' }}>Thank you for reaching out. We&apos;ll be in touch within 3 business days.</p>
      </div>
    )
  }

  return (
    <form className="form" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="p-name">Your Name</label>
          <input id="p-name" name="name" required placeholder="Ada Lovelace" />
        </div>
        <div className="field">
          <label htmlFor="p-org">Organisation</label>
          <input id="p-org" name="org" placeholder="Company / School name" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="p-email">Email</label>
        <input id="p-email" name="email" type="email" required placeholder="you@example.com" />
      </div>
      <div className="field">
        <label htmlFor="p-type">Partnership type</label>
        <select id="p-type" name="type" required>
          <option value="">Select…</option>
          <option>School / University</option>
          <option>Corporate / Company</option>
          <option>Individual Mentor</option>
          <option>NGO / Charity</option>
          <option>Media / Press</option>
          <option>Other</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="p-msg">Tell us about your goals</label>
        <textarea id="p-msg" name="message" required placeholder="What do you hope to achieve through this partnership?" />
      </div>
      {status === 'error' && <p style={{ color: '#c0392b', fontSize: '.875rem', margin: '-.5rem 0 .75rem' }}>{error}</p>}
      <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
      </button>
    </form>
  )
}
