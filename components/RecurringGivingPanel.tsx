'use client'

import { useState } from 'react'

export interface DetailRow {
  label: string
  value: string
  mono?: boolean
  emphasis?: boolean
  hint?: string
}

interface Props {
  reference: string
  rows: DetailRow[]
  amountLabel: string
  initialStatus: 'pending' | 'declared' | 'active' | 'lapsed' | 'cancelled'
  nextDueAt: string | null
  supportEmail: string
}

const GREEN = '#1a3c2e'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked — the value is on screen and selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      style={{
        border: '1px solid #d8d3c9', background: copied ? '#e8f4ec' : '#fff',
        color: copied ? GREEN : '#5a6a5f', borderRadius: 6, padding: '3px 9px',
        fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
        transition: 'all .15s',
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function RecurringGivingPanel({ reference, rows, amountLabel, initialStatus, nextDueAt, supportEmail }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function declareSent() {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/payments/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update your pledge')
      setStatus(data.status ?? 'declared')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'active') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: '50%', background: '#e8f4ec', marginBottom: '1.25rem',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ margin: '0 0 .75rem', fontSize: '1.4rem' }}>Monthly gift active — thank you!</h2>
        <p style={{ color: 'var(--ink-60,#8a9a8f)', marginBottom: 0 }}>
          Your gift of <strong>{amountLabel}/month</strong> is confirmed.
          {nextDueAt && <> Your next cycle is due around {new Date(nextDueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</>}
        </p>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <h2 style={{ margin: '0 0 .75rem', fontSize: '1.3rem' }}>This monthly gift was cancelled</h2>
        <p style={{ color: 'var(--ink-60,#8a9a8f)', marginBottom: 0 }}>
          If that&apos;s a mistake, email <a href={`mailto:${supportEmail}`} style={{ color: GREEN, fontWeight: 600 }}>{supportEmail}</a> quoting {reference}.
        </p>
      </div>
    )
  }

  return (
    <div>
      {status === 'lapsed' && (
        <div style={{ background: '#fef3c7', color: '#92400e', borderRadius: 8, padding: '10px 14px', fontSize: '.85rem', marginBottom: '1rem' }}>
          Your last transfer is overdue. Send this month&apos;s transfer and declare it below to get your monthly gift active again.
        </div>
      )}
      {status === 'declared' && (
        <div style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 8, padding: '10px 14px', fontSize: '.85rem', marginBottom: '1rem' }}>
          Thanks — we&apos;ve noted that you sent this transfer. We&apos;ll confirm once it lands.
        </div>
      )}
      <div className="rgrid" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f' }}>{row.label}</div>
              <div style={{ fontSize: row.emphasis ? '1.05rem' : '.92rem', fontWeight: row.emphasis ? 700 : 500, fontFamily: row.mono ? 'monospace' : undefined }}>
                {row.value}
              </div>
              {row.hint && <div style={{ fontSize: '.72rem', color: '#8a9a8f', marginTop: 2 }}>{row.hint}</div>}
            </div>
            <CopyButton value={row.value} label={row.label} />
          </div>
        ))}
      </div>

      {error && <div style={{ marginBottom: 14, color: '#dc2626', fontSize: '.85rem' }}>{error}</div>}

      <button
        type="button"
        onClick={declareSent}
        disabled={busy || status === 'declared'}
        className="btn btn--block"
        style={{ opacity: busy ? .7 : 1 }}
      >
        {status === 'declared' ? 'Already declared — awaiting confirmation' : busy ? 'Working…' : "I've sent this month's transfer"}
      </button>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.8rem', color: 'var(--ink-60,#8a9a8f)' }}>
        Questions? Email <a href={`mailto:${supportEmail}?subject=Monthly gift ${reference}`} style={{ color: 'inherit', fontWeight: 600 }}>{supportEmail}</a>
      </p>
    </div>
  )
}
