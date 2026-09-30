'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import SpeakButton from './SpeakButton'

type Msg = {
  id: string
  author_type: 'visitor' | 'staff' | 'ai'
  author_name: string
  body: string
  created_at: string
}

const POLL_MS = 8000

export default function TicketThread({
  reference,
  initialMessages,
  closed,
}: {
  reference: string
  initialMessages: Msg[]
  closed: boolean
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(reference)}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { /* transient; the next tick retries */ }
  }, [reference])

  // A closed ticket cannot gain messages, so it is not worth polling.
  useEffect(() => {
    if (closed) return
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [closed, poll])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || busy) return
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(reference)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not send that.'); return }
      setBody('')
      await poll()
    } catch {
      setError('Could not reach us just now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 12 }}>
        {messages.map(m => {
          const mine = m.author_type === 'visitor'
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', marginLeft: mine ? 'auto' : 0 }}>
              <div style={{
                background: mine ? 'var(--green-800, #1a3c2e)' : '#fff',
                color: mine ? '#f4f0e7' : 'inherit',
                border: mine ? 'none' : '1px solid var(--line, #e8e4dc)',
                borderRadius: 12, padding: '12px 14px', whiteSpace: 'pre-wrap', fontSize: '.92rem',
              }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, opacity: .75, marginBottom: 4 }}>
                  {mine ? 'You' : m.author_name} · {new Date(m.created_at).toLocaleString()}
                </div>
                {m.body}
              </div>
              {!mine && <SpeakButton text={m.body} />}
            </div>
          )
        })}
      </div>

      {closed ? (
        <p style={{ marginTop: 24, color: '#6b7a70', fontSize: '.9rem' }}>
          This ticket is closed. <Link href="/support">Open a new one</Link> if you still need help.
        </p>
      ) : (
        <form onSubmit={send} style={{ marginTop: 24, display: 'grid', gap: 10 }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a reply…"
            rows={4}
            maxLength={5000}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid var(--line, #e8e4dc)', borderRadius: 8, fontFamily: 'inherit', fontSize: '.92rem', resize: 'vertical', outline: 'none' }}
          />
          {error && <p style={{ color: '#a33', fontSize: '.86rem', margin: 0 }}>{error}</p>}
          <div>
            <button type="submit" className="btn" disabled={busy || !body.trim()}>
              {busy ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
