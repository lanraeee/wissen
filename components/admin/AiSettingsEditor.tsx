'use client'

import { useState, useEffect } from 'react'
import { AI_SETTINGS_DEFAULTS, coerceAiSettings, type AiSettings } from '@/lib/ai-settings-shared'

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '.88rem',
  border: '1px solid #e8e4dc', borderRadius: 8, fontFamily: 'inherit', outline: 'none',
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', marginBottom: 4 }}>{label}</span>
      {hint && <span style={{ display: 'block', fontSize: '.76rem', color: '#6b7a70', marginBottom: 6 }}>{hint}</span>}
      {children}
    </label>
  )
}

export default function AiSettingsEditor() {
  const [s, setS] = useState<AiSettings>(AI_SETTINGS_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch('/api/admin/content/ai_settings')
      .then(r => r.ok ? r.json() : { value: null })
      .then(d => setS(coerceAiSettings(d.value)))
      .catch(() => setS(AI_SETTINGS_DEFAULTS))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setStatus('Saving…')
    const res = await fetch('/api/admin/content/ai_settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: coerceAiSettings(s) }),
    })
    setStatus(res.ok ? 'Saved.' : 'Could not save — directors only.')
  }

  if (loading) return <p className="admin-page-desc">Loading…</p>

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Support assistant</h2>

      <Field label="Enabled" hint="Off, every chat goes straight to a human instead.">
        <input type="checkbox" checked={s.supportEnabled}
          onChange={e => setS({ ...s, supportEnabled: e.target.checked })} />
      </Field>

      <Field label="Model">
        <input style={input} value={s.supportModel}
          onChange={e => setS({ ...s, supportModel: e.target.value })} />
      </Field>

      <Field label="Monthly call cap" hint="Shared by both agents. Once reached, neither calls Anthropic again until next month.">
        <input style={input} type="number" min={0} max={100000} value={s.monthlyCallCap}
          onChange={e => setS({ ...s, monthlyCallCap: Number(e.target.value) })} />
      </Field>

      <Field
        label="Notes for the assistant"
        hint="Added to what the assistant already knows. The safety rules — never give payment details, never promise a scholarship, never invent a deadline — live in the code and cannot be edited away from here."
      >
        <textarea style={{ ...input, resize: 'vertical' }} rows={5} maxLength={4000}
          value={s.supportExtraContext}
          onChange={e => setS({ ...s, supportExtraContext: e.target.value })} />
      </Field>

      <h2 style={{ fontSize: '1.05rem', borderTop: '1px solid #e8e4dc', paddingTop: 20 }}>Staff AI agent</h2>
      <p style={{ fontSize: '.8rem', color: '#6b7a70', marginTop: 0 }}>
        Who may use it is managed by the master admin on the AI Agent page, not here.
      </p>

      <Field label="Model">
        <input style={input} value={s.adminAgentModel}
          onChange={e => setS({ ...s, adminAgentModel: e.target.value })} />
      </Field>

      <Field label="Max query rounds per question" hint="How many times it may query then reason before answering. Bounds cost per question.">
        <input style={input} type="number" min={1} max={12} value={s.adminAgentMaxTurns}
          onChange={e => setS({ ...s, adminAgentMaxTurns: Number(e.target.value) })} />
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} style={{
          background: '#1a3c2e', color: '#f4f0e7', border: 'none', borderRadius: 8,
          padding: '9px 18px', fontWeight: 700, fontSize: '.84rem', cursor: 'pointer',
        }}>Save</button>
        {status && <span style={{ fontSize: '.82rem', color: '#6b7a70' }}>{status}</span>}
      </div>
    </div>
  )
}
