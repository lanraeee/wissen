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

      <VisitorPanel ticket={ticket} />

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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: '.82rem', lineHeight: 1.6 }}>
      <span style={{ color: '#6b7a70', minWidth: 96, flexShrink: 0 }}>{label}</span>
      <span style={{ wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

// Who you are actually talking to. Everything except the last block is taken
// from the request the visitor's browser already sent -- no fingerprinting,
// no extra round trip.
function VisitorPanel({ ticket }: { ticket: Ticket }) {
  const device = [ticket.device_type, ticket.os, ticket.browser].filter(Boolean).join(' · ')
  // Vercel's edge resolves an IP to the ISP's egress point. Honest at country
  // level, roughly right at city level, meaningless below it -- so it is
  // labelled "approximate" rather than presented as where someone is.
  const coarse = [ticket.geo_city, ticket.geo_region, ticket.geo_country].filter(Boolean).join(', ')

  return (
    <details open style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '.88rem' }}>
        Who you&apos;re talking to
      </summary>
      <div style={{ marginTop: 12, display: 'grid', gap: 2 }}>
        <Row label="Name" value={ticket.requester_name} />
        <Row
          label="Email"
          value={ticket.requester_email
            ? <a href={`mailto:${ticket.requester_email}`}>{ticket.requester_email}</a>
            : <em style={{ color: '#a33' }}>none given — you can only reply in-thread</em>}
        />
        <Row label="Account" value={ticket.user_id ? 'Signed in' : 'Not signed in'} />
        <Row label="Device" value={device} />
        <Row label="Area" value={coarse ? `${coarse} (approximate, from network)` : null} />
        <Row label="Opened from" value={ticket.entry_page} />
        <Row label="Came via" value={ticket.referrer} />
        <Row label="Channel" value={ticket.channel === 'chat' ? 'Live chat' : 'Support form'} />

        {ticket.geo_lat != null && ticket.geo_lng != null ? (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0ece4' }}>
            <Row
              label="Location"
              value={
                <>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${ticket.geo_lat}&mlon=${ticket.geo_lng}#map=17/${ticket.geo_lat}/${ticket.geo_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ticket.geo_lat.toFixed(5)}, {ticket.geo_lng.toFixed(5)}
                  </a>
                  {ticket.geo_accuracy_m ? ` · ±${ticket.geo_accuracy_m}m` : ''}
                </>
              }
            />
            <Row
              label="Shared"
              value={ticket.geo_shared_at
                ? `by the visitor on ${new Date(ticket.geo_shared_at).toLocaleString()}`
                : null}
            />
          </div>
        ) : (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0ece4', fontSize: '.78rem', color: '#6b7a70' }}>
            No precise location. It can only be shared by the visitor tapping
            &ldquo;Share my location&rdquo; in the chat and accepting their browser&apos;s prompt —
            there is no way to obtain it otherwise, and an IP address cannot give it.
          </div>
        )}
      </div>
    </details>
  )
}
