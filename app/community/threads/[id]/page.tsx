'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Thread {
  id: string
  title: string
  body: string
  tag: string
  reply_count: number
  pinned: boolean
  created_at: string
  author_name: string
}

interface Reply {
  id: string
  author_name: string
  body: string
  created_at: string
}

interface Me { id: string; name: string; role?: string }

const TAG_COLOR: Record<string, string> = {
  Jobs: '#1d4ed8', Education: '#7c3aed', Tech: '#0891b2',
  Scholarships: '#b45309', Career: '#15803d', Finance: '#c026d3',
  Discussion: '#6b7280', General: '#6b7280',
}

function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#0F2D1D,#1a4a2e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#B8952A',
    }}>{initials}</div>
  )
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const replyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/forum/threads/${id}`).then(r => r.json()),
      fetch(`/api/forum/threads/${id}/replies`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([t, r, m]) => {
      if (t?.error) { router.push('/community/threads'); return }
      setThread(t)
      setReplies(r)
      setMe(m)
      setLoaded(true)
    })
  }, [id, router])

  async function postReply() {
    if (!replyBody.trim()) return
    setPosting(true); setError('')
    const res = await fetch(`/api/forum/threads/${id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyBody }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to post'); setPosting(false); return }
    setReplies(r => [...r, data])
    setThread(t => t ? { ...t, reply_count: t.reply_count + 1 } : t)
    setReplyBody('')
    setPosting(false)
    setTimeout(() => replyRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function deleteThread() {
    if (!confirm('Delete this thread permanently?')) return
    await fetch(`/api/forum/threads/${id}`, { method: 'DELETE' })
    router.push('/community/threads')
  }

  if (!loaded) return (
    <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--ink-60)' }}>Loading…</div>
    </section>
  )

  if (!thread) return null

  const isAdmin = me?.role === 'admin' || me?.role === 'director' || me?.role === 'editor'

  return (
    <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap" style={{ maxWidth: 780 }}>

        {/* Back */}
        <Link href="/community/threads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.82rem', color: 'var(--ink-60)', textDecoration: 'none', marginBottom: '1.5rem' }}>
          ← Back to threads
        </Link>

        {/* Thread */}
        <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, background: TAG_COLOR[thread.tag] ?? '#6b7280', color: '#fff', padding: '3px 10px', borderRadius: 99 }}>{thread.tag}</span>
              {thread.pinned && <span style={{ fontSize: '.72rem', color: '#B8952A', fontWeight: 600 }}>📌 Pinned</span>}
            </div>
            <h1 style={{ fontSize: '1.3rem', margin: '0 0 16px', lineHeight: 1.35 }}>{thread.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Avatar name={thread.author_name} size={32} />
              <div>
                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{thread.author_name}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--ink-60)' }}>{ago(thread.created_at)}</div>
              </div>
              {isAdmin && (
                <button onClick={deleteThread} style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                  Delete thread
                </button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '.92rem', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{thread.body}</p>
          </div>
        </div>

        {/* Replies */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-60)', marginBottom: '1rem' }}>
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {replies.length === 0 && (
              <div style={{ background: 'var(--paper)', padding: '24px 28px', color: 'var(--ink-60)', fontSize: '.88rem' }}>
                No replies yet. Be the first to respond!
              </div>
            )}
            {replies.map(reply => (
              <div key={reply.id} style={{ background: 'var(--paper)', padding: '20px 28px', display: 'flex', gap: 14 }}>
                <Avatar name={reply.author_name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{reply.author_name}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--ink-60)' }}>{ago(reply.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply form */}
        <div ref={replyRef} style={{ background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', padding: '24px 28px' }}>
          {me ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Avatar name={me.name} size={32} />
                <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Reply as {me.name}</span>
              </div>
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write your reply…"
                rows={4}
                style={{ width: '100%', padding: '10px 14px', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: 8, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postReply() }}
              />
              {error && <p style={{ color: '#dc2626', fontSize: '.8rem', margin: '6px 0 0' }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={postReply}
                  disabled={posting || !replyBody.trim()}
                  className="btn"
                  style={{ opacity: posting || !replyBody.trim() ? 0.6 : 1 }}
                >
                  {posting ? 'Posting…' : 'Post Reply'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p style={{ margin: '0 0 14px', color: 'var(--ink-60)', fontSize: '.88rem' }}>Sign in to join the discussion.</p>
              <Link href="/login" className="btn">Sign In</Link>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
