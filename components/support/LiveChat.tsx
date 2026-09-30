'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import VoiceRecorder from './VoiceRecorder'
import SpeakButton from './SpeakButton'

type Msg = { id: string; author_type: 'visitor' | 'staff' | 'ai'; author_name: string; body: string; audio_id: string | null; created_at: string }

const STORAGE_KEY = 'wh_support_reference'
const POLL_MS = 4000

// Polling, not SSE or a websocket vendor. An open chat costs one cheap GET
// every few seconds; SSE on Fluid Compute would hold a function open and bill
// active CPU for the whole conversation, and a realtime vendor would add a
// third-party dependency and its outage surface. Revisit if concurrent chats
// ever reach the point where that trade flips.
export default function LiveChat() {
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [handedOff, setHandedOff] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setReference(saved)
    } catch { /* private mode, blocked storage -- chat still works, just not resumed */ }
  }, [])

  const poll = useCallback(async () => {
    if (!reference) return
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(reference)}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
      if (data.ticket?.escalated) setHandedOff(true)
    } catch { /* offline or a blip; the next tick retries */ }
  }, [reference])

  // Only poll while the panel is actually open. A closed widget on a page
  // someone left in a tab should not keep hitting the server all day.
  useEffect(() => {
    if (!open || !reference) return
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [open, reference, poll])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  async function send(body: string, audioId?: string) {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setError('')

    // Show the visitor's own line immediately; the poll reconciles it with the
    // stored copy a moment later.
    const optimistic: Msg = {
      id: `local-${Date.now()}`, author_type: 'visitor', author_name: 'You',
      body: text, audio_id: audioId ?? null, created_at: new Date().toISOString(),
    }
    setMessages(m => [...m, optimistic])
    setInput('')

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, message: text, audioId: audioId ?? null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not send that.'); return }

      if (data.reference && data.reference !== reference) {
        setReference(data.reference)
        try { localStorage.setItem(STORAGE_KEY, data.reference) } catch { /* non-fatal */ }
      }
      if (data.handedOff) setHandedOff(true)
      await poll()
    } catch {
      setError('Could not reach us just now. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open support chat"
        style={{
          position: 'fixed', right: 22, bottom: 22, zIndex: 95,
          background: 'var(--green-800, #1a3c2e)', color: '#f4f0e7',
          border: 'none', borderRadius: 99, padding: '12px 20px',
          boxShadow: '0 4px 16px rgba(0,0,0,.18)', cursor: 'pointer',
          fontWeight: 700, fontSize: '.9rem',
        }}
      >
        Need help?
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Support chat"
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 95,
        width: 'min(380px, calc(100vw - 32px))', maxHeight: 'min(560px, calc(100vh - 32px))',
        background: '#fff', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,.22)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      <header style={{ background: 'var(--green-800, #1a3c2e)', color: '#f4f0e7', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.92rem' }}>Wissen-Haus Support</div>
          <div style={{ fontSize: '.72rem', opacity: .75 }}>
            {handedOff ? 'A team member will reply here' : 'Usually answers instantly'}
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close support chat" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f4f0e7', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: '#faf8f4' }}>
        {messages.length === 0 && (
          <p style={{ fontSize: '.85rem', color: '#6b7a70', margin: 0 }}>
            Ask us about courses, scholarships, the Career Clarity Fair, or anything else.
            You can type or record a voice note.
          </p>
        )}
        {messages.map(m => {
          const mine = m.author_type === 'visitor'
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                background: mine ? 'var(--green-800, #1a3c2e)' : '#fff',
                color: mine ? '#f4f0e7' : 'inherit',
                border: mine ? 'none' : '1px solid #e8e4dc',
                borderRadius: 12, padding: '9px 12px', fontSize: '.86rem', whiteSpace: 'pre-wrap',
              }}>
                {!mine && <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#6b7a70', marginBottom: 3 }}>{m.author_name}</div>}
                {m.body}
                {m.audio_id && (
                  <audio controls preload="none" src={`/api/support/voice/${m.audio_id}`} style={{ display: 'block', marginTop: 8, width: '100%', maxWidth: 240 }} />
                )}
              </div>
              {!mine && <SpeakButton text={m.body} />}
            </div>
          )
        })}
        {sending && <div style={{ alignSelf: 'flex-start', fontSize: '.78rem', color: '#6b7a70' }}>Typing…</div>}
        <div ref={endRef} />
      </div>

      {error && <div style={{ background: '#fdecea', color: '#a33', padding: '8px 14px', fontSize: '.8rem' }}>{error}</div>}

      <div style={{ borderTop: '1px solid #e8e4dc', padding: 10, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder="Type your message…"
            rows={2}
            maxLength={2000}
            style={{ flex: 1, resize: 'none', border: '1px solid #e8e4dc', borderRadius: 8, padding: '8px 10px', fontSize: '.86rem', fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            style={{
              background: 'var(--green-800, #1a3c2e)', color: '#f4f0e7', border: 'none',
              borderRadius: 8, padding: '10px 14px', fontWeight: 700, fontSize: '.84rem',
              cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', opacity: sending || !input.trim() ? .5 : 1,
            }}
          >
            Send
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <VoiceRecorder
            disabled={sending}
            onRecorded={({ audioId, transcript }) =>
              // With no transcript (Firefox, or speech recognition refused) the
              // audio still sends -- staff can listen. The placeholder is what
              // the thread shows in place of words.
              send(transcript || '🎤 Voice note', audioId)
            }
          />
        </div>
        {reference && (
          <p style={{ fontSize: '.7rem', color: '#8a9a8f', margin: '8px 0 0' }}>
            Reference <strong>{reference}</strong> — <Link href={`/support/${encodeURIComponent(reference)}`} style={{ color: '#8a9a8f' }}>open full thread</Link>
          </p>
        )}
      </div>
    </div>
  )
}
