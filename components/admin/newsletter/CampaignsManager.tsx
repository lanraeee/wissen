'use client'

import { useState, useEffect, useCallback } from 'react'

interface Campaign {
  id: string
  subject: string
  body: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
  recipient_count: number
  sent_count: number
  failed_count: number
  created_at: string
  sent_at: string | null
}

interface NewsletterTemplate { id: string; name: string; subject: string; body: string }

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 10px', border: '1px solid #d0ccc4', borderRadius: 7, fontSize: '.88rem', width: '100%', ...extra,
})
const label = (text: string) => (
  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>{text}</div>
)
const btn = (bg: string, color = '#fff') => ({
  padding: '6px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
})

const STATUS_COLORS: Record<string, string> = { draft: '#6b7280', sending: '#f59e0b', sent: '#10b981', failed: '#dc2626' }

const EMPTY = { subject: '', body: '' }

export default function CampaignsManager() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null)
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [activeSubscriberCount, setActiveSubscriberCount] = useState<number | null>(null)
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/newsletter/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns ?? [])
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/admin/newsletter/templates').then(r => r.json()).then(d => setTemplates(d.templates ?? []))
    fetch('/api/admin/newsletter/subscribers').then(r => r.json()).then(d =>
      setActiveSubscriberCount((d.subscribers ?? []).filter((s: { status: string }) => s.status === 'subscribed').length)
    )
  }, [])

  function startNew() {
    setEditing(EMPTY)
    setErr('')
    setPreview(null)
  }

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id)
    if (t) setEditing(e => ({ ...e, subject: t.subject, body: t.body }))
  }

  async function runPreview() {
    if (!editing) return
    setPreviewing(true); setErr('')
    try {
      const res = await fetch('/api/admin/newsletter/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editing.subject ?? '', body: editing.body ?? '' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Could not render preview.')
      setPreview(d)
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Could not render preview.')
    } finally {
      setPreviewing(false)
    }
  }

  async function save() {
    if (!editing) return
    setErr('')
    setBusy(true)
    const isNew = !editing.id
    const res = await fetch(isNew ? '/api/admin/newsletter/campaigns' : `/api/admin/newsletter/campaigns/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: editing.subject, body: editing.body }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      setErr(d?.error ?? 'Could not save campaign.')
      return
    }
    setEditing(null)
    load()
  }

  async function remove(c: Campaign) {
    if (!confirm(`Delete the draft "${c.subject}"?`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/newsletter/campaigns/${c.id}`, { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      alert(d?.error ?? 'Could not delete this campaign.')
    }
    load()
  }

  async function send(c: Campaign) {
    const count = activeSubscriberCount ?? 0
    if (!confirm(`Send "${c.subject}" to ${count} active subscriber${count === 1 ? '' : 's'} now? This can't be undone.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/newsletter/campaigns/${c.id}/send`, { method: 'POST' })
    const d = await res.json().catch(() => null)
    setBusy(false)
    if (!res.ok) alert(d?.error ?? 'Could not send this campaign.')
    else alert(`Sent to ${d.sent} of ${d.recipientCount} subscriber(s)${d.failed > 0 ? ` (${d.failed} failed)` : ''}.`)
    load()
  }

  if (editing) return (
    <div>
      {err && <p style={{ color: '#dc2626', fontSize: '.82rem', marginBottom: 12 }}>{err}</p>}
      <div className="rgrid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div>
          {templates.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {label('Start from a template')}
              <select style={inp()} defaultValue="" onChange={e => e.target.value && applyTemplate(e.target.value)}>
                <option value="">— None —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            {label('Subject')}
            <input style={inp()} value={editing.subject ?? ''} onChange={e => setEditing(c => ({ ...c, subject: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            {label('HTML + CSS body (rendered inside the Wissen-Haus email shell)')}
            <textarea
              rows={18}
              style={inp({ fontFamily: 'monospace', fontSize: '.8rem', resize: 'vertical' })}
              value={editing.body ?? ''}
              onChange={e => setEditing(c => ({ ...c, body: e.target.value }))}
              spellCheck={false}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={runPreview} disabled={previewing} style={btn('#1d4ed8')}>{previewing ? 'Rendering…' : 'Preview'}</button>
            <button onClick={save} disabled={busy || !editing.subject || !editing.body} style={btn('#1a3c2e')}>Save Draft</button>
            <button onClick={() => setEditing(null)} disabled={busy} style={btn('#e8e4dc', '#3a4a3f')}>Cancel</button>
          </div>
        </div>

        <div>
          {label('Preview')}
          {preview ? (
            <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0ece4', fontSize: '.82rem', color: '#3a4a3f' }}>
                <strong>Subject:</strong> {preview.subject}
              </div>
              <iframe title="Campaign preview" srcDoc={preview.html} sandbox="" style={{ width: '100%', height: 560, border: 'none' }} />
            </div>
          ) : (
            <div style={{ background: '#f9f7f3', borderRadius: 10, padding: 40, textAlign: 'center', color: '#8a9a8f', fontSize: '.85rem' }}>
              Click Preview to see this campaign rendered in the email shell.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={startNew} style={btn('#1a3c2e')}>New Campaign</button>
        {activeSubscriberCount !== null && <span style={{ fontSize: '.8rem', color: '#8a9a8f' }}>{activeSubscriberCount} active subscriber{activeSubscriberCount === 1 ? '' : 's'} will receive new sends</span>}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto' }}>
        {campaigns === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No campaigns yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                {['Subject', 'Status', 'Sent / Recipients', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#1a2e24', fontWeight: 600 }}>{c.subject}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: (STATUS_COLORS[c.status] ?? '#6b7280') + '22', color: STATUS_COLORS[c.status] ?? '#6b7280',
                      borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize',
                    }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f' }}>
                    {c.status === 'draft' ? '—' : `${c.sent_count} / ${c.recipient_count}${c.failed_count > 0 ? ` (${c.failed_count} failed)` : ''}`}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.78rem', color: '#8a9a8f', whiteSpace: 'nowrap' }}>
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.status === 'draft' && (
                      <>
                        <button onClick={() => { setEditing(c); setPreview(null) }} disabled={busy} style={btn('#e8e4dc', '#3a4a3f')}>Edit</button>
                        <button onClick={() => send(c)} disabled={busy} style={btn('#1a3c2e')}>Send</button>
                        <button onClick={() => remove(c)} disabled={busy} style={btn('#dc2626')}>Delete</button>
                      </>
                    )}
                    {c.status !== 'draft' && <button onClick={() => { setEditing({ ...c, id: undefined }); setPreview(null) }} disabled={busy} style={btn('#e8e4dc', '#3a4a3f')}>Duplicate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
