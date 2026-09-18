'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export interface DetailRow {
  label: string
  value: string
  mono?: boolean
  emphasis?: boolean
}

interface Props {
  reference: string
  rows: DetailRow[]
  amountLabel: string
  initialStatus: 'awaiting_transfer' | 'declared_sent' | 'confirmed' | 'cancelled'
  certUrl?: string
  instructions?: string
  donorEmail: string
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
      // Clipboard is blocked (insecure context, denied permission) — the value
      // is on screen and selectable, so there's nothing to recover from.
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

export default function BankTransferPanel({
  reference, rows, amountLabel, initialStatus, certUrl, instructions, donorEmail,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function declareSent() {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/payments/bank-transfer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update your donation')
      setStatus(data.status ?? 'declared_sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'confirmed') {
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
        <h2 style={{ margin: '0 0 .75rem', fontSize: '1.4rem' }}>Transfer received — thank you!</h2>
        <p style={{ color: 'var(--ink-60,#8a9a8f)', marginBottom: '1.5rem' }}>
          Your gift of <strong>{amountLabel}</strong> has been confirmed. Your receipt has been emailed to {donorEmail}.
        </p>
        {certUrl && (
          <Link href={certUrl} className="btn btn--lg">View your donation certificate</Link>
        )}
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <h2 style={{ margin: '0 0 .75rem', fontSize: '1.3rem' }}>This donation was cancelled</h2>
        <p style={{ color: 'var(--ink-60,#8a9a8f)', marginBottom: '1.5rem' }}>
          If that&apos;s a mistake, email <a href="mailto:info@wissenhaus.org" style={{ color: GREEN, fontWeight: 600 }}>info@wissenhaus.org</a> quoting {reference}.
        </p>
        <Link href="/donate" className="btn">Start a new donation</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Account details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
        {rows.map(row => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '13px 16px', borderRadius: 8,
              background: row.emphasis ? '#f0f7f3' : '#f9f7f3',
              border: row.emphasis ? '1px solid #c8e0d0' : '1px solid transparent',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '.67rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '.07em', color: '#8a9a8f', marginBottom: 3,
              }}>
                {row.label}
              </div>
              <div style={{
                fontSize: row.emphasis ? '1.05rem' : '.95rem',
                fontWeight: row.emphasis ? 700 : 600,
                color: '#1a2e24', wordBreak: 'break-word',
                fontFamily: row.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
                letterSpacing: row.mono ? '.03em' : 'normal',
              }}>
                {row.value}
              </div>
            </div>
            <CopyButton value={row.value} label={row.label} />
          </div>
        ))}
      </div>

      {instructions && (
        <p style={{
          fontSize: '.85rem', color: '#5a6a5f', background: '#fdf8ec',
          border: '1px solid #f0e2c0', borderRadius: 8, padding: '12px 14px', margin: '0 0 20px',
        }}>
          {instructions}
        </p>
      )}

      {status === 'declared_sent' ? (
        <div style={{
          textAlign: 'center', background: '#f0f7f3', border: '1px solid #c8e0d0',
          borderRadius: 10, padding: '20px 18px',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>⏳</div>
          <h3 style={{ margin: '0 0 .5rem', fontSize: '1.05rem' }}>Thank you — we&apos;re watching for your transfer.</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '.88rem', color: '#5a6a5f' }}>
            Bank transfers usually clear within one working day (longer for international payments).
            As soon as it lands we&apos;ll email your receipt and donation certificate to {donorEmail}.
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            style={{
              border: '1px solid #c8e0d0', background: '#fff', color: GREEN,
              borderRadius: 7, padding: '7px 16px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Check status
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="btn btn--block btn--lg"
            onClick={declareSent}
            disabled={busy}
            style={{ fontSize: '1rem' }}
          >
            {busy ? 'Saving…' : "I've sent the transfer"}
          </button>
          <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--ink-60,#8a9a8f)', marginTop: '.9rem' }}>
            Tell us once you&apos;ve made the payment so we can match it and send your certificate.
          </p>
        </>
      )}

      {error && (
        <p style={{ color: '#c0392b', fontSize: '.85rem', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      )}
    </div>
  )
}
