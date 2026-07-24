'use client'

import { useState } from 'react'

const s = (bg: string, color = '#fff') => ({
  padding: '5px 12px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer',
})

const inp = { padding: '6px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }

const BLANK = { title: '', company: '', type: 'job', url: '', eligibility: 'worldwide', date_posted: '', tags: '' }

export default function OpportunityManager({ onRefresh }: { onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [cronMsg, setCronMsg] = useState('')

  async function add() {
    if (!form.title || !form.url) return
    setBusy(true)
    await fetch('/api/admin/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
    })
    setBusy(false)
    setForm(BLANK)
    setShowForm(false)
    onRefresh()
  }

  async function triggerCron() {
    setBusy(true)
    setCronMsg('Running…')
    const res = await fetch('/api/admin/cron', { method: 'POST' })
    const data = await res.json()
    setCronMsg(data.success ? `Done — ${data.upserted} upserted` : `Error: ${data.error}`)
    setBusy(false)
    onRefresh()
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={s('#1a3c2e')} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add Manually'}
        </button>
        <button style={s('#1d4ed8')} onClick={triggerCron} disabled={busy}>Refresh from Sources</button>
        {cronMsg && <span style={{ fontSize: '.8rem', color: '#3a4a3f' }}>{cronMsg}</span>}
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {([
            ['title', 'Title *'],
            ['company', 'Company'],
            ['url', 'URL *'],
            ['date_posted', 'Date Posted (YYYY-MM-DD)'],
            ['tags', 'Tags (comma-separated)'],
          ] as [keyof typeof BLANK, string][]).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f' }}>{label}</label>
              <input style={inp} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f' }}>Type</label>
            <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['job', 'internship', 'scholarship', 'competition'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f' }}>Eligibility</label>
            <select style={inp} value={form.eligibility} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))}>
              {[['worldwide', 'Open Worldwide'], ['africa', 'Open to Africa'], ['nigeria', 'Open to Nigeria']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <button style={s('#1a3c2e')} onClick={add} disabled={busy || !form.title || !form.url}>Save Opportunity</button>
          </div>
        </div>
      )}
    </div>
  )
}
