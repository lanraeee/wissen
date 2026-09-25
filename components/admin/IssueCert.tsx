'use client'

import { useState } from 'react'

const COURSES = [
  { id: 'soft-skills', title: 'Soft Skills for the Modern Workplace' },
  { id: 'career-launch', title: 'Career Launch Blueprint' },
  { id: 'ai', title: 'AI for Students & Young Professionals' },
  { id: 'financial-literacy', title: 'Financial Literacy for Young Adults' },
  { id: 'workplace-readiness', title: 'Workplace Readiness' },
]

export default function IssueCert({ onRefresh }: { onRefresh: () => void }) {
  const [email, setEmail] = useState('')
  const [courseId, setCourseId] = useState(COURSES[0].id)
  const [markComplete, setMarkComplete] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function issue(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), courseId, markComplete }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? 'Something went wrong' })
      } else if (data.alreadyExisted) {
        setResult({ ok: true, msg: `Certificate already exists: ${data.certificateId}` })
      } else {
        setResult({ ok: true, msg: `Issued: ${data.certificateId}` })
        setEmail('')
        onRefresh()
      }
    } catch {
      setResult({ ok: false, msg: 'Network error' })
    }
    setBusy(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 32 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>
        Issue Certificate
      </h3>
      <form onSubmit={issue} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#8a9a8f', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>User Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#8a9a8f', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Course</label>
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', background: '#fff', boxSizing: 'border-box' }}
          >
            {COURSES.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', color: '#3a4a3f', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={markComplete}
              onChange={e => setMarkComplete(e.target.checked)}
              style={{ accentColor: '#1a3c2e' }}
            />
            Mark all modules complete
          </label>
          <button
            type="submit"
            disabled={busy}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .7 : 1 }}
          >
            {busy ? 'Issuing…' : 'Issue Certificate'}
          </button>
        </div>
      </form>
      {result && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, fontSize: '.83rem', fontWeight: 500, background: result.ok ? '#d1fae5' : '#fee2e2', color: result.ok ? '#065f46' : '#dc2626' }}>
          {result.msg}
        </div>
      )}
    </div>
  )
}
