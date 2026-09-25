'use client'

import { useEffect, useState } from 'react'

interface StaffEntry {
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

interface UsageData {
  courseProgress: { course_id: string; module_id: number; completed_at: string }[]
  certificates: { course_id: string; certificate_id: string; issued_at: string }[]
  submissions: { type: string; status: string | null; data: Record<string, unknown> | null; created_at: string }[]
  forumThreads: { id: string; title: string; tag: string; reply_count: number; created_at: string }[]
  forumReplies: { id: string; thread_id: string; body: string; created_at: string }[]
  logins: { ip: string | null; user_agent: string | null; created_at: string }[]
  pageViews: { pathname: string; referrer: string | null; country: string | null; city: string | null; device_type: string | null; browser: string | null; created_at: string }[]
}

type ActivityResponse =
  | { kind: 'user'; target: { first_name: string; last_name: string }; courseProgress: UsageData['courseProgress']; certificates: UsageData['certificates']; submissions: UsageData['submissions']; forumThreads: UsageData['forumThreads']; forumReplies: UsageData['forumReplies']; logins: UsageData['logins']; pageViews: UsageData['pageViews'] }
  | { kind: 'staff'; target: { first_name: string; last_name: string }; entries: StaffEntry[] }

const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ margin: '0 0 8px', fontSize: '.8rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f' }}>
        {title} <span style={{ color: '#c0bcb2' }}>({count})</span>
      </h4>
      {count === 0
        ? <p style={{ margin: 0, fontSize: '.82rem', color: '#c0bcb2' }}>Nothing yet.</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>}
    </div>
  )
}

const row = { background: '#f9f7f3', borderRadius: 6, padding: '8px 12px', fontSize: '.82rem' }

export default function UserActivityModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<ActivityResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/admin/users/${userId}/activity`).then(async res => {
      if (cancelled) return
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not load activity.')
      } else {
        setData(await res.json())
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [userId])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,33,21,0.6)', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
            {data ? `${data.target.first_name} ${data.target.last_name}` : 'Activity'}
          </h3>
          <button onClick={onClose} style={{ background: '#f0ece4', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
        </div>

        {loading && <p style={{ color: '#8a9a8f' }}>Loading…</p>}
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        {data?.kind === 'staff' && (
          <Section title="Admin actions" count={data.entries.length}>
            {data.entries.map((e, i) => (
              <div key={i} style={row}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{e.action}</strong>
                  <span style={{ color: '#8a9a8f', fontSize: '.75rem', whiteSpace: 'nowrap' }}>{fmt(e.created_at)}</span>
                </div>
                {e.target_type && (
                  <div style={{ color: '#3a4a3f', marginTop: 2 }}>
                    {e.target_type}{e.target_id ? ` · ${e.target_id}` : ''}
                  </div>
                )}
                {e.details && Object.keys(e.details).length > 0 && (
                  <div style={{ color: '#8a9a8f', fontSize: '.75rem', marginTop: 2, fontFamily: 'monospace' }}>
                    {JSON.stringify(e.details)}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {data?.kind === 'user' && (
          <>
            <Section title="Course progress" count={data.courseProgress.length}>
              {data.courseProgress.map((m, i) => (
                <div key={i} style={row}>{m.course_id} · module {m.module_id} <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(m.completed_at)}</span></div>
              ))}
            </Section>
            <Section title="Certificates" count={data.certificates.length}>
              {data.certificates.map((c, i) => (
                <div key={i} style={row}>{c.course_id} · {c.certificate_id} <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(c.issued_at)}</span></div>
              ))}
            </Section>
            <Section title="Submissions (incl. donations)" count={data.submissions.length}>
              {data.submissions.map((s, i) => (
                <div key={i} style={row}>
                  <span style={{ textTransform: 'capitalize' }}>{s.type}</span>{s.status ? ` · ${s.status}` : ''}
                  <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(s.created_at)}</span>
                </div>
              ))}
            </Section>
            <Section title="Forum threads" count={data.forumThreads.length}>
              {data.forumThreads.map(t => (
                <div key={t.id} style={row}>{t.title} <span style={{ color: '#8a9a8f' }}>({t.tag})</span> <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(t.created_at)}</span></div>
              ))}
            </Section>
            <Section title="Forum replies" count={data.forumReplies.length}>
              {data.forumReplies.map(r => (
                <div key={r.id} style={row}>{r.body.slice(0, 80)}{r.body.length > 80 ? '…' : ''} <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(r.created_at)}</span></div>
              ))}
            </Section>
            <Section title="Login history" count={data.logins.length}>
              {data.logins.map((l, i) => (
                <div key={i} style={row}>
                  {l.ip ?? 'unknown IP'}
                  {l.user_agent && <span style={{ color: '#8a9a8f' }}> · {l.user_agent.slice(0, 50)}</span>}
                  <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(l.created_at)}</span>
                </div>
              ))}
            </Section>
            <Section title="Pages visited" count={data.pageViews.length}>
              {data.pageViews.map((p, i) => (
                <div key={i} style={row}>
                  {p.pathname}
                  {(p.city || p.country) && <span style={{ color: '#8a9a8f' }}> · {[p.city, p.country].filter(Boolean).join(', ')}</span>}
                  <span style={{ color: '#8a9a8f', float: 'right' }}>{fmt(p.created_at)}</span>
                </div>
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
