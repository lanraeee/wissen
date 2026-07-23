'use client'

import { useState, FormEvent } from 'react'

export default function VolunteerForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${fd.get('firstName')} ${fd.get('lastName')}`.trim(),
          email: fd.get('email'),
          role: fd.get('role'),
          message: fd.get('bio'),
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
        <h3 style={{ marginTop: '1rem' }}>Application received!</h3>
        <p style={{ color: 'var(--ink-60)', marginTop: '.5rem' }}>Thank you for volunteering. We&apos;ll be in touch within 5 business days.</p>
      </div>
    )
  }

  return (
    <form className="form" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="v-first">First Name</label>
          <input id="v-first" name="firstName" required placeholder="Ada" />
        </div>
        <div className="field">
          <label htmlFor="v-last">Last Name</label>
          <input id="v-last" name="lastName" required placeholder="Lovelace" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="v-email">Email</label>
        <input id="v-email" name="email" type="email" required placeholder="you@example.com" />
      </div>
      <div className="field">
        <label htmlFor="v-role">How do you want to contribute?</label>
        <select id="v-role" name="role" required>
          <option value="">Select an option…</option>
          <option>Mentoring</option>
          <option>Technical Training</option>
          <option>Operations &amp; Events</option>
          <option>Content Creation</option>
          <option>Other</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="v-bio">Brief background (current role, skills, why you want to volunteer)</label>
        <textarea id="v-bio" name="bio" required placeholder="Tell us about yourself…" />
      </div>
      {status === 'error' && <p style={{ color: '#c0392b', fontSize: '.875rem', margin: '-.5rem 0 .75rem' }}>{error}</p>}
      <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
