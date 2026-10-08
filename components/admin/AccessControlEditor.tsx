'use client'

import { useState, useEffect, useCallback } from 'react'
import { TOP_LEVEL_SECTIONS, WHF_CIO_SECTIONS } from '@/lib/admin-sections'
import { ACCESS_GRANTS_KEY, ACCESS_GRANTS_DEFAULTS, coerceAccessGrants, type AccessGrants } from '@/lib/admin-access-grants-shared'

interface TrusteeAccount { id: string; email: string; first_name: string; last_name: string; created_at: string }

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const btn = (bg: string, color = '#fff') => ({ padding: '6px 16px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

export default function AccessControlEditor() {
  const [trustees, setTrustees] = useState<TrusteeAccount[] | null>(null)
  const [grants, setGrants] = useState<AccessGrants>(ACCESS_GRANTS_DEFAULTS)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [newForm, setNewForm] = useState({ email: '', firstName: '', lastName: '' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const [ta, ag] = await Promise.all([
        fetch('/api/admin/trustee-accounts'),
        fetch(`/api/admin/content/${ACCESS_GRANTS_KEY}`),
      ])
      if (!ta.ok) throw new Error('Failed to load trustee accounts')
      setTrustees(await ta.json())
      const agData = ag.ok ? await ag.json() : { value: null }
      setGrants(coerceAccessGrants(agData.value))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createTrustee() {
    if (!newForm.email.trim() || !newForm.firstName.trim() || !newForm.lastName.trim()) {
      setError('Email, first name and last name are all required'); return
    }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/trustee-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Could not create trustee account')
      setNewForm({ email: '', firstName: '', lastName: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create trustee account')
    } finally {
      setCreating(false)
    }
  }

  function toggle(email: string, key: string, checked: boolean) {
    setGrants(g => {
      const current = new Set(g.grants[email] ?? [])
      if (checked) current.add(key); else current.delete(key)
      return { grants: { ...g.grants, [email]: [...current] } }
    })
  }

  async function saveGrants(email: string) {
    setSavingFor(email)
    setError('')
    try {
      const res = await fetch(`/api/admin/content/${ACCESS_GRANTS_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: grants }),
      })
      if (!res.ok) throw new Error('Save failed — master admin only')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingFor(null)
    }
  }

  if (!trustees) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      {error && <div role="alert" style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>+ Add trustee</h2>
        <div className="rgrid-2" style={{ gap: 12, marginBottom: 12 }}>
          <input style={inp} placeholder="Email" type="email" value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })} />
          <input style={inp} placeholder="First name" value={newForm.firstName} onChange={e => setNewForm({ ...newForm, firstName: e.target.value })} />
          <input style={inp} placeholder="Last name" value={newForm.lastName} onChange={e => setNewForm({ ...newForm, lastName: e.target.value })} />
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '.78rem', color: '#8a9a8f' }}>
          Creates a login with no access yet. They claim it with &quot;Forgot password&quot; on the normal login page, then grant them sections below.
        </p>
        <button style={btn('#1a3c2e')} onClick={createTrustee} disabled={creating}>{creating ? 'Creating…' : 'Create trustee login'}</button>
      </div>

      {trustees.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No trustee accounts yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {trustees.map(t => {
            const theirKeys = new Set(grants.grants[t.email.toLowerCase()] ?? [])
            const open = expanded === t.email
            return (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.first_name} {t.last_name}</div>
                    <div style={{ fontSize: '.82rem', color: '#8a9a8f' }}>{t.email} · {theirKeys.size} section{theirKeys.size === 1 ? '' : 's'} granted</div>
                  </div>
                  <button style={btn(open ? '#8a9a8f' : '#1a3c2e')} onClick={() => setExpanded(open ? null : t.email)}>
                    {open ? 'Close' : 'Manage access'}
                  </button>
                </div>

                {open && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e8e4dc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px 24px', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', marginBottom: 8 }}>Top-level sections</div>
                        {TOP_LEVEL_SECTIONS.map(s => (
                          <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', padding: '3px 0' }}>
                            <input type="checkbox" checked={theirKeys.has(s.key)} onChange={e => toggle(t.email.toLowerCase(), s.key, e.target.checked)} />
                            {s.label}
                          </label>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', marginBottom: 8 }}>WHF-CIO Records tabs</div>
                        {WHF_CIO_SECTIONS.map(s => (
                          <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', padding: '3px 0' }}>
                            <input type="checkbox" checked={theirKeys.has(s.key)} onChange={e => toggle(t.email.toLowerCase(), s.key, e.target.checked)} />
                            {s.label.replace('WHF-CIO → ', '')}
                          </label>
                        ))}
                        <p style={{ margin: '8px 0 0', fontSize: '.74rem', color: '#8a9a8f' }}>
                          Granting any WHF-CIO tab shows the WHF-CIO Records link in their nav. Safeguarding and AI Agent have their own, separate grant mechanisms (not here).
                        </p>
                      </div>
                    </div>
                    <button style={btn('#1a3c2e')} onClick={() => saveGrants(t.email.toLowerCase())} disabled={savingFor === t.email.toLowerCase()}>
                      {savingFor === t.email.toLowerCase() ? 'Saving…' : 'Save access'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
