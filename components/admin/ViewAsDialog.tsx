'use client'

import { useState } from 'react'

// Confirms a support "view as member" before it starts. The admin's password is
// always required and checked on the server. The reason is required too, except
// for the master admin (reasonOptional), whose views are not logged.
export default function ViewAsDialog({ userId, memberName, onClose, reasonOptional = false }: { userId: string; memberName: string; onClose: () => void; reasonOptional?: boolean }) {
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'The view could not be started.')
        setBusy(false)
        return
      }
      try { sessionStorage.setItem('wh_view_as_return', window.location.pathname + window.location.search) } catch { /* optional */ }
      window.location.assign('/profile')
    } catch {
      setError('Network error. The view was not started.')
      setBusy(false)
    }
  }

  const field = { width: '100%', padding: '8px 10px', fontSize: '.9rem', border: '1px solid #d0ccc4', borderRadius: 6, boxSizing: 'border-box' as const }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="view-as-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }}
    >
      <form onSubmit={start} style={{ background: '#fff', borderRadius: 10, padding: 20, width: '100%', maxWidth: 440, display: 'grid', gap: 12 }}>
        <h2 id="view-as-title" style={{ margin: 0, fontSize: '1.05rem' }}>View as {memberName}</h2>
        <p style={{ margin: 0, fontSize: '.85rem', color: '#4b5563', lineHeight: 1.5 }}>
          You will see the member’s account exactly as they see it, read-only, for 30 minutes.
          Nothing you do in the view can change their account.{' '}
          {reasonOptional
            ? 'As master admin, this view is not recorded in the activity log, and a reason is optional.'
            : 'This view is recorded in the activity log with your reason.'}
        </p>
        <label style={{ display: 'grid', gap: 4, fontSize: '.8rem', fontWeight: 600 }}>
          Reason for viewing{reasonOptional ? ' (optional)' : ''}
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={500} required={!reasonOptional}
            placeholder="e.g. Member cannot see their certificate (ticket #123)"
            style={{ ...field, fontWeight: 400, resize: 'vertical' }} />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: '.8rem', fontWeight: 600 }}>
          Your password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
            style={{ ...field, fontWeight: 400 }} />
        </label>
        {error && <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '.85rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={busy}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d0ccc4', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={busy || (!reasonOptional && reason.trim().length < 10) || !password}
            style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#7c2d12', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: busy ? .6 : 1 }}>
            {busy ? 'Starting…' : 'Start view'}
          </button>
        </div>
      </form>
    </div>
  )
}
