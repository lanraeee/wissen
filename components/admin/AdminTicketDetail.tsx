'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Ticket, TicketMessage } from '@/lib/tickets'

const BUBBLE: Record<string, React.CSSProperties> = {
  visitor: { background: '#fff', border: '1px solid #e8e4dc' },
  staff: { background: '#1a3c2e', color: '#f4f0e7' },
  ai: { background: '#f2f8f4', border: '1px solid #d9ebe0' },
}

export default function AdminTicketDetail({
  ticket: initialTicket,
  initialMessages,
}: {
  ticket: Ticket
  initialMessages: TicketMessage[]
}) {
  const [ticket, setTicket] = useState(initialTicket)
  const [messages, setMessages] = useState(initialMessages)
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/admin/support/${encodeURIComponent(ticket.reference)}`)
    if (!res.ok) return
    const data = await res.json()
    setTicket(data.ticket)
    setMessages(data.messages ?? [])
  }, [ticket.reference])

  async function act(payload: Record<string, unknown>) {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/admin/support/${encodeURIComponent(ticket.reference)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not complete that.')
        return
      }
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/support" style={{ fontSize: '.82rem', color: '#6b7a70' }}>← Back to queue</Link>
        <h1 className="admin-page-title" style={{ marginTop: 8 }}>{ticket.subject}</h1>
        <p className="admin-page-desc" style={{ marginBottom: 0 }}>
          <code>{ticket.reference}</code> · {ticket.requester_name}
          {ticket.requester_email ? ` · ${ticket.requester_email}` : ' · no email on file'}
          {ticket.channel === 'chat' ? ' · from live chat' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={ticket.status} disabled={busy} onChange={e => act({ status: e.target.value })}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e8e4dc', fontSize: '.82rem' }}>
          {['open', 'pending', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={ticket.priority} disabled={busy} onChange={e => act({ priority: e.target.value })}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e8e4dc', fontSize: '.82rem' }}>
          {['low', 'normal', 'high'].map(p => <option key={p} value={p}>{p} priority</option>)}
        </select>
        {ticket.escalated
          ? <span style={{ fontSize: '.78rem', color: '#a33', fontWeight: 700 }}>Needs a human — the assistant has stepped back</span>
          : <span style={{ fontSize: '.78rem', color: '#1a6b3c' }}>The assistant is still handling this</span>}
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {messages.map(m => (
          <div key={m.id} style={{ maxWidth: '85%', marginLeft: m.author_type === 'staff' ? 'auto' : 0 }}>
            <div style={{ ...BUBBLE[m.author_type], borderRadius: 12, padding: '12px 14px', whiteSpace: 'pre-wrap', fontSize: '.9rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, opacity: .75, marginBottom: 4 }}>
                {m.author_name}
                {m.author_type === 'ai' ? ' (assistant)' : ''}
                {m.internal ? ' · INTERNAL NOTE' : ''}
                {' · '}{new Date(m.created_at).toLocaleString()}
              </div>
              {m.body}
              {m.audio_id && (
                <audio controls preload="none" src={`/api/support/voice/${m.audio_id}`} style={{ display: 'block', marginTop: 10, width: '100%', maxWidth: 300 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder={internal ? 'Internal note — the visitor never sees this…' : 'Reply to the visitor…'}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e8e4dc', borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem', resize: 'vertical', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} />
            Internal note
          </label>
          <button
            onClick={() => { act({ reply, internal }); setReply('') }}
            disabled={busy || !reply.trim()}
            style={{
              background: '#1a3c2e', color: '#f4f0e7', border: 'none', borderRadius: 8,
              padding: '9px 18px', fontWeight: 700, fontSize: '.84rem',
              cursor: busy || !reply.trim() ? 'not-allowed' : 'pointer', opacity: busy || !reply.trim() ? .5 : 1,
            }}
          >
            {busy ? 'Sending…' : internal ? 'Save note' : 'Send reply'}
          </button>
          {!internal && ticket.requester_email && (
            <span style={{ fontSize: '.78rem', color: '#6b7a70' }}>Emails {ticket.requester_email}</span>
          )}
        </div>
        {error && <p style={{ color: '#a33', fontSize: '.84rem', marginTop: 10 }}>{error}</p>}
      </div>
    </>
  )
}
