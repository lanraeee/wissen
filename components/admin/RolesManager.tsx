'use client'

import { useState, useEffect, useCallback } from 'react'
import { TOP_LEVEL_SECTIONS, WHF_CIO_SECTIONS } from '@/lib/admin-sections'
import { PRESET_ROLES, MAX_ROLES } from '@/lib/admin-access-roles-shared'
import type { AccessLevel } from '@/lib/admin-access-grants-shared'

interface RoleSummary { id: string; name: string; description: string; grants: Record<string, AccessLevel> }
interface Draft { id?: string; name: string; description: string; grants: Record<string, AccessLevel> }

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const btn = (bg: string, color = '#fff') => ({ padding: '6px 14px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)
const levelSelect = { padding: '3px 6px', fontSize: '.78rem', border: '1px solid #d0ccc4', borderRadius: 5, background: '#fff' } as const

export default function RolesManager() {
  const [roles, setRoles] = useState<RoleSummary[] | null>(null)
  const [holders, setHolders] = useState<Record<string, number>>({})
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/permissions')
      if (!res.ok) throw new Error('Failed to load roles')
      const d = await res.json()
      setRoles(d.roles as RoleSummary[])
      const counts: Record<string, number> = {}
      for (const u of d.users as { roleIds: string[] }[]) for (const id of u.roleIds) counts[id] = (counts[id] ?? 0) + 1
      setHolders(counts)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function post(body: Record<string, unknown>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Action failed')
      setDraft(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  function setLevel(key: string, level: '' | AccessLevel) {
    setDraft(d => {
      if (!d) return d
      const grants = { ...d.grants }
      if (level === '') delete grants[key]
      else grants[key] = level
      return { ...d, grants }
    })
  }

  if (!roles) return <div style={{ padding: 24, color: error ? '#dc2626' : '#8a9a8f' }}>{error || 'Loading…'}</div>

  const existingNames = new Set(roles.map(r => r.name))
  const presets = PRESET_ROLES.filter(p => !existingNames.has(p.name))

  const renderSections = (title: string, sections: typeof TOP_LEVEL_SECTIONS) => (
    <div>
      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', margin: '8px 0 4px' }}>{title}</div>
      {sections.map(s => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '3px 0', fontSize: '.85rem' }}>
          <span>{s.label.replace('WHF-CIO → ', '')}</span>
          <select style={levelSelect} value={draft?.grants[s.key] ?? ''} onChange={e => setLevel(s.key, e.target.value as '' | AccessLevel)}>
            <option value="">No access</option>
            <option value="read">Read only</option>
            <option value="write">Read &amp; write</option>
          </select>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {error && <div role="alert" style={{ marginBottom: 14, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <p style={{ margin: '0 0 14px', fontSize: '.82rem', color: '#555' }}>
        A role is a named bundle of section access. Assign roles to accounts from the Current permissions tab; editing a role updates everyone who holds it. Access only applies to Trustee accounts. Where an account has several sources, the highest level wins.
      </p>

      {!draft && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <button style={btn('#1a3c2e')} disabled={roles.length >= MAX_ROLES} onClick={() => setDraft({ name: '', description: '', grants: {} })}>+ New role</button>
          {presets.length > 0 && (
            <select style={{ ...inp, width: 'auto' }} value="" onChange={e => {
              const p = PRESET_ROLES.find(x => x.name === e.target.value)
              if (p) setDraft({ name: p.name, description: p.description, grants: { ...p.grants } })
            }}>
              <option value="">Start from a template…</option>
              {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          )}
        </div>
      )}

      {draft && (
        <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>{draft.id ? 'Edit role' : 'New role'}</h2>
          <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
            <input style={inp} placeholder="Role name" maxLength={60} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            <input style={inp} placeholder="Description (optional)" maxLength={300} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="rgrid-2" style={{ gap: 20, marginBottom: 14 }}>
            {renderSections('Sections', TOP_LEVEL_SECTIONS)}
            {renderSections('WHF-CIO records', WHF_CIO_SECTIONS)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn('#1a3c2e')} disabled={saving || !draft.name.trim()}
              onClick={() => post({ action: 'save_role', id: draft.id, name: draft.name, description: draft.description, grants: draft.grants })}>
              {saving ? 'Saving…' : 'Save role'}
            </button>
            <button style={btn('#8a9a8f')} onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}

      {roles.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No roles yet. Create one or start from a template.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {roles.map(r => {
            const n = Object.keys(r.grants).length
            const w = Object.values(r.grants).filter(l => l === 'write').length
            const count = holders[r.id] ?? 0
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  {r.description && <div style={{ fontSize: '.8rem', color: '#8a9a8f' }}>{r.description}</div>}
                  <div style={{ fontSize: '.78rem', color: '#555', marginTop: 4 }}>
                    {n} section{n === 1 ? '' : 's'}{n ? (w ? ` · ${w} write` : ' · read only') : ''} · held by {count} account{count === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btn('#1a3c2e')} onClick={() => setDraft({ id: r.id, name: r.name, description: r.description, grants: { ...r.grants } })}>Edit</button>
                  <button style={btn('#fff', '#b91c1c')} disabled={saving}
                    onClick={() => { if (window.confirm(`Delete "${r.name}"? ${count ? `${count} account${count === 1 ? '' : 's'} will lose the access it gives.` : ''}`)) post({ action: 'delete_role', id: r.id }) }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
