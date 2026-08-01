'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Thread {
  id: string
  title: string
  tag: string
  reply_count: number
  pinned: boolean
  created_at: string
  author_name: string
}

interface Me { id: string; name: string; role?: string }

const THREAD_TAGS = ['Jobs', 'Education', 'Tech', 'Scholarships', 'Career', 'Finance', 'Discussion', 'General']

function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ThreadsClient({
  threads: initial,
  tags,
  tagColors,
}: {
  threads: Thread[]
  tags: string[]
  tagColors: Record<string, string>
}) {
  const [threads, setThreads] = useState<Thread[]>(initial)
  const [activeTag, setActiveTag] = useState('All')
  const [me, setMe] = useState<Me | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('Discussion')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(setMe)
  }, [])

  const filtered = activeTag === 'All' ? threads : threads.filter(t => t.tag === activeTag)

  async function post() {
    if (!title.trim() || !body.trim()) { setError('Title and body are required'); return }
    setPosting(true); setError('')
    const res = await fetch('/api/forum/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, tag }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to post'); setPosting(false); return }
    setThreads(ts => [{ ...data, reply_count: 0, pinned: false }, ...ts])
    setTitle(''); setBody(''); setTag('Discussion')
    setShowForm(false); setPosting(false)
  }

  return (
    <div>
      {/* Tag filter + new thread button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(t => (
            <button key={t} onClick={() => setActiveTag(t)} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTag === t ? 'var(--green-800)' : 'var(--paper)',
              color: activeTag === t ? '#f4f0e7' : 'var(--ink-60)',
              boxShadow: activeTag === t ? 'none' : '0 0 0 1px var(--line)',
            }}>{t}</button>
          ))}
        </div>
        {me ? (
          <button onClick={() => setShowForm(s => !s)} className="btn" style={{ fontSize: '.82rem', padding: '8px 18px' }}>
            {showForm ? 'Cancel' : '+ New Thread'}
          </button>
        ) : (
          <Link href="/login" style={{ fontSize: '.82rem', color: 'var(--ink-60)', textDecoration: 'none' }}>Sign in to post</Link>
        )}
      </div>

      {/* New thread form */}
      {showForm && (
        <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Start a new thread</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-60)', display: 'block', marginBottom: 4 }}>Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What's your question or topic?"
                maxLength={200}
                style={{ width: '100%', padding: '9px 12px', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <div>
                <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-60)', display: 'block', marginBottom: 4 }}>Category</label>
                <select value={tag} onChange={e => setTag(e.target.value)} style={{ width: '100%', padding: '9px 12px', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'inherit', background: 'white' }}>
                  {THREAD_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-60)', display: 'block', marginBottom: 4 }}>Body *</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Share more detail…"
                rows={5}
                maxLength={5000}
                style={{ width: '100%', padding: '9px 12px', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: 8, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ fontSize: '.72rem', color: 'var(--ink-60)', textAlign: 'right', marginTop: 2 }}>{body.length}/5000</div>
            </div>
            {error && <p style={{ margin: 0, color: '#dc2626', fontSize: '.82rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={post} disabled={posting || !title.trim() || !body.trim()} className="btn" style={{ opacity: posting ? 0.7 : 1 }}>
                {posting ? 'Posting…' : 'Post Thread'}
              </button>
              <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '8px 16px', borderRadius: 8, fontSize: '.85rem', background: 'none', border: '1px solid var(--line)', cursor: 'pointer', color: 'var(--ink-60)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', color: 'var(--ink-60)' }}>
          {activeTag === 'All' ? 'No threads yet. Be the first to start a discussion!' : `No threads tagged "${activeTag}" yet.`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {filtered.map(t => (
            <Link key={t.id} href={`/community/threads/${t.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--paper)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-50)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--paper)')}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.3rem', flexWrap: 'wrap' }}>
                    {t.pinned && <span style={{ fontSize: '.68rem', color: '#B8952A' }}>📌</span>}
                    <span style={{ fontSize: '.68rem', fontWeight: 700, background: tagColors[t.tag] ?? '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>{t.tag}</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '.95rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{t.title}</h3>
                  <p style={{ margin: 0, fontSize: '.75rem', color: 'var(--ink-60)' }}>by {t.author_name} · {ago(t.created_at)}</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--green-800)' }}>{t.reply_count}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: '.08em' }}>replies</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
