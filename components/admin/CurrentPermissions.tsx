'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SECTION_BY_KEY } from '@/lib/admin-sections'
import type { AccessLevel } from '@/lib/admin-access-grants-shared'

interface RoleSummary { id: string; name: string; description: string; grants: Record<string, AccessLevel> }
interface PermissionRow {
  id: string | null
  email: string
  name: string
  accountRole: string
  createdAt: string | null
  isMasterAdmin: boolean
  blocked: boolean
  safeguarding: 'lead' | 'team' | null
  aiAgent: boolean
  directGrants: Record<string, AccessLevel>
  roleIds: string[]
  effective: Record<string, { level: AccessLevel; sources: string[] }>
}
interface Payload { users: PermissionRow[]; total: number; page: number; limit: number; all: boolean; aiEnabled: boolean; roles: RoleSummary[] }

const ACCOUNT_ROLE_LABEL: Record<string, string> = { user: 'Member', trustee: 'Trustee', editor: 'Editor', admin: 'Admin', missing: 'No account' }
const ACCOUNT_ROLE_OPTIONS = ['user', 'trustee', 'editor', 'admin']

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, boxSizing: 'border-box' as const }
const btn = (bg: string, color = '#fff') => ({ padding: '5px 12px', borderRadius: 6, fontSize: '.76rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)
const chip = (bg: string, color: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '.7rem', fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' } as const)

function labelFor(key: string) {
  return SECTION_BY_KEY[key]?.label ?? key
}

function summarise(u: PermissionRow) {
  const levels = Object.values(u.effective)
  const writes = levels.filter(l => l.level === 'write').length
  return { total: levels.length, writes }
}

export default function CurrentPermissions() {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const reqId = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    const id = ++reqId.current
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (showAll) params.set('all', '1')
      if (debouncedQ) params.set('q', debouncedQ)
      const res = await fetch(`/api/admin/permissions?${params}`)
      if (!res.ok) throw new Error(res.status === 403 ? 'Only the master admin can view permissions' : 'Failed to load permissions')
      const json = await res.json() as Payload
      if (id === reqId.current) { setData(json); setError('') }
    } catch (err) {
      if (id === reqId.current) setError(err instanceof Error ? err.message : 'Failed to load')
    }
  }, [page, showAll, debouncedQ])

  useEffect(() => { load() }, [load])

  async function run(key: string, body: Record<string, unknown>, success?: string) {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Action failed')
      if (success) setNotice(success)
      else if (Array.isArray(d.cleared)) setNotice(d.cleared.length ? `Revoked: ${d.cleared.join(', ')}.` : 'Nothing to revoke.')
      setConfirming(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  if (!data) return <div style={{ padding: 24, color: error ? '#dc2626' : '#8a9a8f' }}>{error || 'Loading…'}</div>

  const roleName = (id: string) => data.roles.find(r => r.id === id)?.name ?? id
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit))

  return (
    <div>
      {error && <div role="alert" style={{ marginBottom: 14, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}
      {notice && <div role="status" style={{ marginBottom: 14, color: '#166534', fontSize: '.85rem', background: '#dcfce7', padding: '8px 14px', borderRadius: 7 }}>{notice}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <input style={{ ...inp, flex: '1 1 220px', maxWidth: 340 }} placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
        <label style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showAll} onChange={e => { setShowAll(e.target.checked); setPage(1) }} />
          Include members with no permissions
        </label>
        <span style={{ fontSize: '.8rem', color: '#8a9a8f' }}>{data.total} account{data.total === 1 ? '' : 's'}</span>
      </div>

      {!data.aiEnabled && data.users.some(u => u.aiAgent) && (
        <p style={{ margin: '0 0 12px', fontSize: '.78rem', color: '#8a9a8f' }}>The AI agent is switched off in Settings, so AI access below is dormant until it is turned on.</p>
      )}

      {data.users.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No accounts match.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {data.users.map(u => {
            const { total, writes } = summarise(u)
            const open = expanded === u.email
            const locked = u.isMasterAdmin
            const unassigned = data.roles.filter(r => !u.roleIds.includes(r.id))
            const sectionKeys = Object.keys(u.effective).sort((a, b) => labelFor(a).localeCompare(labelFor(b)))
            const hasAnything = total > 0 || u.aiAgent || u.safeguarding === 'team' || u.accountRole === 'admin' || u.accountRole === 'editor' || u.accountRole === 'trustee'
            return (
              <div key={u.email} style={{ background: '#fff', border: `1px solid ${u.blocked ? '#fca5a5' : '#e8e4dc'}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{u.name || u.email}</div>
                    {u.name && <div style={{ fontSize: '.8rem', color: '#8a9a8f', overflowWrap: 'anywhere' }}>{u.email}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {u.isMasterAdmin
                        ? <span style={chip('#1a3c2e', '#fff')}>Master admin · full control</span>
                        : <span style={chip(u.accountRole === 'user' ? '#f3f1ec' : u.accountRole === 'missing' ? '#fef3c7' : '#e0ecff', u.accountRole === 'missing' ? '#92400e' : '#1e3a8a')}>{ACCOUNT_ROLE_LABEL[u.accountRole] ?? u.accountRole}</span>}
                      {u.blocked && <span style={chip('#fee2e2', '#991b1b')}>Admin access blocked</span>}
                      {u.safeguarding && <span style={chip('#fde7f3', '#9d174d')}>Safeguarding {u.safeguarding === 'lead' ? 'lead' : 'team'}</span>}
                      {u.aiAgent && <span style={chip('#ede9fe', '#5b21b6')}>AI agent</span>}
                      {u.roleIds.map(id => <span key={id} style={chip('#e6f4ea', '#166534')}>{roleName(id)}</span>)}
                      {!u.isMasterAdmin && total > 0 && <span style={chip('#f3f1ec', '#555')}>{total} section{total === 1 ? '' : 's'}{writes ? ` · ${writes} write` : ' · read only'}</span>}
                      {!u.isMasterAdmin && !hasAnything && <span style={chip('#f3f1ec', '#8a9a8f')}>No permissions</span>}
                    </div>
                  </div>
                  {!locked && (
                    <button style={btn(open ? '#8a9a8f' : '#1a3c2e')} onClick={() => setExpanded(open ? null : u.email)}>
                      {open ? 'Close' : 'Review'}
                    </button>
                  )}
                </div>

                {open && !locked && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e8e4dc', display: 'grid', gap: 16 }}>
                    {u.accountRole === 'user' && (total > 0 || u.roleIds.length > 0) && (
                      <p style={{ margin: 0, fontSize: '.78rem', color: '#92400e', background: '#fef3c7', padding: '6px 10px', borderRadius: 6 }}>
                        This account is a regular member, so the grants below have no effect until its account type is set to Trustee.
                      </p>
                    )}

                    <div>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', marginBottom: 6 }}>Account type</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select style={inp} value={u.accountRole === 'missing' ? '' : u.accountRole} disabled={!u.id || busy === `${u.email}:acct`}
                          onChange={e => run(`${u.email}:acct`, { action: 'set_account_role', email: u.email, role: e.target.value }, 'Account type updated.')}>
                          {u.accountRole === 'missing' && <option value="">No account</option>}
                          {ACCOUNT_ROLE_OPTIONS.map(r => <option key={r} value={r}>{ACCOUNT_ROLE_LABEL[r]}</option>)}
                        </select>
                        <span style={{ fontSize: '.76rem', color: '#8a9a8f' }}>Admin and Editor are fixed staff roles; Trustee gets only what is granted below.</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', marginBottom: 6 }}>Roles</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {u.roleIds.length === 0 && <span style={{ fontSize: '.82rem', color: '#8a9a8f' }}>None assigned.</span>}
                        {u.roleIds.map(id => (
                          <span key={id} style={{ ...chip('#e6f4ea', '#166534'), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {roleName(id)}
                            <button aria-label={`Remove role ${roleName(id)}`} disabled={busy === `${u.email}:role:${id}`}
                              onClick={() => run(`${u.email}:role:${id}`, { action: 'unassign_role', email: u.email, roleId: id }, 'Role removed.')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#166534', fontWeight: 700, padding: 0 }}>×</button>
                          </span>
                        ))}
                        {unassigned.length > 0 && (
                          <select style={inp} value="" onChange={e => e.target.value && run(`${u.email}:assign`, { action: 'assign_role', email: u.email, roleId: e.target.value }, 'Role assigned.')}>
                            <option value="">+ Assign role…</option>
                            {unassigned.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', marginBottom: 6 }}>Section access</div>
                      {sectionKeys.length === 0 ? <span style={{ fontSize: '.82rem', color: '#8a9a8f' }}>No sections granted.</span> : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', color: '#8a9a8f' }}>
                                <th style={{ padding: '4px 8px 4px 0', fontWeight: 600 }}>Section</th>
                                <th style={{ padding: '4px 8px', fontWeight: 600 }}>Level</th>
                                <th style={{ padding: '4px 8px', fontWeight: 600 }}>From</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {sectionKeys.map(key => {
                                const e = u.effective[key]
                                const direct = e.sources.includes('direct')
                                return (
                                  <tr key={key} style={{ borderTop: '1px solid #f0ede6' }}>
                                    <td style={{ padding: '5px 8px 5px 0' }}>{labelFor(key)}</td>
                                    <td style={{ padding: '5px 8px' }}>
                                      <span style={chip(e.level === 'write' ? '#fff1d6' : '#e7eefc', e.level === 'write' ? '#92400e' : '#1e3a8a')}>{e.level === 'write' ? 'Read & write' : 'Read only'}</span>
                                    </td>
                                    <td style={{ padding: '5px 8px', color: '#555' }}>{e.sources.map(s => s === 'direct' ? 'Direct grant' : roleName(s)).join(', ')}</td>
                                    <td style={{ padding: '5px 0', textAlign: 'right' }}>
                                      {direct
                                        ? <button style={btn('#fff', '#b91c1c')} disabled={busy === `${u.email}:sec:${key}`}
                                            onClick={() => run(`${u.email}:sec:${key}`, { action: 'revoke_section', email: u.email, section: key }, `${labelFor(key)} access revoked.`)}>Revoke</button>
                                        : <span style={{ fontSize: '.72rem', color: '#8a9a8f' }}>remove the role</span>}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {(u.aiAgent || u.safeguarding) && (
                      <div>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', letterSpacing: '.04em', marginBottom: 6 }}>Other access</div>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {u.aiAgent && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', fontSize: '.84rem' }}>
                              <span>AI agent (can read every table)</span>
                              <button style={btn('#fff', '#b91c1c')} disabled={busy === `${u.email}:ai`}
                                onClick={() => run(`${u.email}:ai`, { action: 'revoke_ai', email: u.email }, 'AI agent access revoked.')}>Revoke</button>
                            </div>
                          )}
                          {u.safeguarding && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', fontSize: '.84rem' }}>
                              <span>Safeguarding {u.safeguarding === 'lead' ? 'lead (set in configuration)' : 'team'}</span>
                              {u.safeguarding === 'team'
                                ? <button style={btn('#fff', '#b91c1c')} disabled={busy === `${u.email}:sg`}
                                    onClick={() => run(`${u.email}:sg`, { action: 'revoke_safeguarding', email: u.email }, 'Safeguarding access revoked.')}>Revoke</button>
                                : <span style={{ fontSize: '.72rem', color: '#8a9a8f' }}>cannot be revoked here</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f0ede6', paddingTop: 12 }}>
                      {confirming === u.email ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '.82rem' }}>Remove every permission from {u.email} and set them back to a regular member?</span>
                          <button style={btn('#b91c1c')} disabled={busy === `${u.email}:all`} onClick={() => run(`${u.email}:all`, { action: 'revoke_all', email: u.email })}>Yes, revoke all</button>
                          <button style={btn('#8a9a8f')} onClick={() => setConfirming(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button style={btn('#fff', '#b91c1c')} onClick={() => setConfirming(u.email)}>Revoke all access…</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {data.all && totalPages > 1 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16, fontSize: '.82rem' }}>
          <button style={btn('#1a3c2e')} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button style={btn('#1a3c2e')} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
