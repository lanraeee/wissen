'use client'

import { useState } from 'react'

type Query = { sql: string; rows: number; error?: string }
type Turn = { question: string; answer?: string; queries?: Query[]; refused?: string }

export default function AiAgentConsole({
  isMaster,
  enabled,
  allowedEmails,
}: {
  isMaster: boolean
  enabled: boolean
  allowedEmails: string[]
}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || busy) return
    setBusy(true)
    setQuestion('')
    setTurns(t => [...t, { question: q }])
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setTurns(t => t.map((turn, i) => i === t.length - 1
        ? { ...turn, answer: data.answer, queries: data.queries, refused: data.refused ?? data.error }
        : turn))
    } catch {
      setTurns(t => t.map((turn, i) => i === t.length - 1 ? { ...turn, refused: 'Could not reach the agent.' } : turn))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {isMaster && <GrantPanel enabled={enabled} allowedEmails={allowedEmails} />}

      <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
        {turns.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <p className="admin-page-desc" style={{ margin: '0 0 10px' }}>Things it can answer:</p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: '.86rem', lineHeight: 1.9 }}>
              <li>How many scholarship applicants scored above 70 but have no device?</li>
              <li>Which pages did people visit before opening a support ticket last week?</li>
              <li>Summarise the themes in this month&apos;s support conversations.</li>
              <li>Draft a funder update using our actual programme numbers.</li>
            </ul>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} style={{ display: 'grid', gap: 8 }}>
            <div style={{ background: '#1a3c2e', color: '#f4f0e7', borderRadius: 10, padding: '11px 14px', fontSize: '.9rem', marginLeft: 'auto', maxWidth: '80%' }}>
              {t.question}
            </div>

            {t.refused && (
              <div style={{ background: '#fdecea', color: '#a33', borderRadius: 10, padding: '11px 14px', fontSize: '.86rem' }}>
                {t.refused}
              </div>
            )}

            {t.answer && (
              <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', fontSize: '.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                {t.answer}
              </div>
            )}

            {/* Every query is shown, not hidden behind the answer. A number you
                cannot trace to a query is a number you should not trust. */}
            {t.queries && t.queries.length > 0 && (
              <details style={{ background: '#f7f5f0', borderRadius: 8, padding: '10px 14px', fontSize: '.8rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  {t.queries.length} quer{t.queries.length === 1 ? 'y' : 'ies'} run
                </summary>
                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  {t.queries.map((q, qi) => (
                    <div key={qi}>
                      <pre style={{ margin: 0, padding: 10, background: '#fff', borderRadius: 6, overflowX: 'auto', fontSize: '.76rem' }}>{q.sql}</pre>
                      <div style={{ color: q.error ? '#a33' : '#6b7a70', marginTop: 4 }}>
                        {q.error ? `refused: ${q.error}` : `${q.rows} row${q.rows === 1 ? '' : 's'}`}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}

        {busy && <p className="admin-page-desc" style={{ margin: 0 }}>Thinking…</p>}
      </div>

      <form onSubmit={ask} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(e) }}
          rows={3}
          maxLength={4000}
          placeholder="Ask about your data, or ask it to draft something…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e8e4dc', borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem', resize: 'vertical', outline: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <button type="submit" disabled={busy || !question.trim()} style={{
            background: '#1a3c2e', color: '#f4f0e7', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontWeight: 700, fontSize: '.84rem',
            cursor: busy || !question.trim() ? 'not-allowed' : 'pointer', opacity: busy || !question.trim() ? .5 : 1,
          }}>
            {busy ? 'Working…' : 'Ask'}
          </button>
          <span style={{ fontSize: '.76rem', color: '#6b7a70' }}>Read-only. It cannot change or send anything.</span>
        </div>
      </form>
    </>
  )
}

// Only rendered for the master admin. The API enforces the same thing
// independently -- a hidden button is not a permission.
function GrantPanel({ enabled, allowedEmails }: { enabled: boolean; allowedEmails: string[] }) {
  const [on, setOn] = useState(enabled)
  const [emails, setEmails] = useState(allowedEmails.join('\n'))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState('')

  async function save() {
    setBusy(true); setSaved('')
    try {
      const list = emails.split(/[\n,]/).map(s => s.trim()).filter(s => s.includes('@'))
      const res = await fetch('/api/admin/ai/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: list, enabled: on }),
      })
      setSaved(res.ok ? 'Saved.' : 'Could not save that.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details style={{ background: '#fff8e6', border: '1px solid #f0dfae', borderRadius: 10, padding: 16, marginBottom: 20 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '.86rem', color: '#5c4a12' }}>
        Access control (master admin only)
      </summary>
      <p style={{ fontSize: '.82rem', color: '#5c4a12', margin: '12px 0' }}>
        This agent can read every table, including personal data. Grant it deliberately.
        Your own access does not depend on this list and cannot be removed here.
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', marginBottom: 10 }}>
        <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
        Allow granted staff to use the agent
      </label>
      <textarea
        value={emails}
        onChange={e => setEmails(e.target.value)}
        rows={3}
        placeholder="one email per line"
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #e8e4dc', borderRadius: 8, fontFamily: 'monospace', fontSize: '.82rem', outline: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button onClick={save} disabled={busy} style={{
          background: '#5c4a12', color: '#fff', border: 'none', borderRadius: 8,
          padding: '7px 16px', fontWeight: 700, fontSize: '.82rem', cursor: busy ? 'wait' : 'pointer',
        }}>
          {busy ? 'Saving…' : 'Save access'}
        </button>
        {saved && <span style={{ fontSize: '.8rem', color: '#5c4a12' }}>{saved}</span>}
      </div>
    </details>
  )
}
