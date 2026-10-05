'use client'

import { useCallback, useEffect, useState } from 'react'
import { inp, lbl, btn, th, td, fmtDate, dateInput, humanise } from '../cio-ui'
import Badge from './Badge'
import { CONCERN_TYPES, INCIDENT_STATUSES, PERSON_AT_RISK, RISK_LEVELS } from '@/lib/safeguarding-schema'

type Incident = Record<string, unknown> & {
  id: string
  reference: string
  source: string
  reported_at: string
  status: string
  risk_level: string
  immediate_danger: boolean
  description: string
}

interface TeamMember { id: string; email: string; name: string | null; role_title: string | null; has_account: boolean }
interface Team { lead: { email: string; has_account: boolean }; members: TeamMember[] }

const SOURCE_LABELS: Record<string, string> = {
  safeguarding_form: 'Report form',
  contact_form: 'Contact form',
  support_ticket: 'Support ticket',
  manual: 'Logged by staff',
}

const RISK_TONE: Record<string, 'green' | 'red' | 'amber' | 'grey'> = { unassessed: 'grey', low: 'green', medium: 'amber', high: 'red', critical: 'red' }
const STATUS_TONE: Record<string, 'green' | 'red' | 'amber' | 'grey'> = { new: 'red', triaging: 'amber', referred: 'amber', monitoring: 'amber', closed: 'green' }

const TRIAGE_KEYS = ['status', 'risk_level', 'concern_type', 'person_at_risk', 'assigned_to', 'referred_to', 'actions_taken', 'outcome', 'closed_on'] as const
type Triage = Record<(typeof TRIAGE_KEYS)[number], string>

const opt = (vs: readonly string[]) => vs.map(v => <option key={v} value={v}>{humanise(v)}</option>)

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d?.error || 'Request failed')
  return d
}

export default function SafeguardingTab({ isDirector }: { isDirector: boolean }) {
  const [rows, setRows] = useState<Incident[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [triage, setTriage] = useState<Triage | null>(null)
  const [newForm, setNewForm] = useState<Record<string, string | boolean> | null>(null)
  const [member, setMember] = useState({ email: '', name: '', role_title: '' })

  const load = useCallback(async () => {
    try {
      const [incidents, t] = await Promise.all([
        send('/api/admin/whf-cio/safeguarding', 'GET'),
        send('/api/admin/whf-cio/safeguarding/team', 'GET'),
      ])
      setRows(incidents)
      setTeam(t)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(fn: () => Promise<unknown>, done?: string) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
      await load()
      if (done) setNotice(done)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      return false
    } finally {
      setBusy(false)
    }
  }

  function open(r: Incident) {
    if (openId === r.id) { setOpenId(null); setTriage(null); return }
    const t = {} as Triage
    for (const k of TRIAGE_KEYS) t[k] = k === 'closed_on' ? dateInput(r[k]) : String(r[k] ?? '')
    setOpenId(r.id)
    setTriage(t)
  }

  async function saveTriage(id: string) {
    if (!triage) return
    const body: Record<string, string | null> = {}
    for (const k of TRIAGE_KEYS) body[k] = triage[k] === '' && k !== 'status' && k !== 'risk_level' && k !== 'person_at_risk' ? null : triage[k]
    await act(() => send(`/api/admin/whf-cio/safeguarding/${id}`, 'PUT', body), 'Saved.')
  }

  async function logIncident() {
    if (!newForm) return
    if (!String(newForm.description ?? '').trim()) { setError('Describe the concern'); return }
    const ok = await act(() => send('/api/admin/whf-cio/safeguarding', 'POST', {
      ...newForm, concern_type: newForm.concern_type || null,
    }), 'Incident logged.')
    if (ok) setNewForm(null)
  }

  async function addMember(email: string, name?: string, role_title?: string) {
    const r = await act(async () => {
      const d = await send('/api/admin/whf-cio/safeguarding/team', 'POST', { email, name: name || null, role_title: role_title || null })
      if (d.invited) setNotice(`A link to set a password has been emailed to ${email}. It expires in an hour; after that they can use "Forgot password" on the sign-in page.`)
    })
    if (r) setMember({ email: '', name: '', role_title: '' })
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const openCount = rows.filter(r => r.status !== 'closed').length
  const urgent = rows.filter(r => r.status !== 'closed' && (r.immediate_danger || r.risk_level === 'high' || r.risk_level === 'critical')).length
  const unassessed = rows.filter(r => r.risk_level === 'unassessed').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Safeguarding incident log</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>
            Reports from the form on /safeguarding, contact-form messages marked or worded as safeguarding, support tickets
            that read like one, and incidents logged by hand. Only directors and the designated safeguarding team can see this.
            Every view and change is recorded in the activity log.
          </p>
        </div>
        <button style={btn('#1a3c2e')} disabled={newForm !== null}
          onClick={() => setNewForm({ person_at_risk: 'unknown', concern_type: '', description: '', reporter_name: '', reporter_email: '', reporter_phone: '', reporter_relationship: '', location: '', immediate_danger: false })}>
          + Log incident
        </button>
      </div>

      {error && <div role="alert" style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}
      {notice && <div role="status" style={{ marginBottom: 16, color: '#166534', fontSize: '.85rem', background: '#dcfce7', padding: '8px 14px', borderRadius: 7 }}>{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, fontSize: '.85rem', padding: 16, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, marginBottom: 20 }}>
        <div><div style={{ color: '#8a9a8f', marginBottom: 4 }}>Open cases</div><div style={{ fontSize: '1.3rem', fontWeight: 600 }}>{openCount}</div></div>
        <div><div style={{ color: '#8a9a8f', marginBottom: 4 }}>Urgent or high risk</div><div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#dc2626' }}>{urgent}</div></div>
        <div><div style={{ color: '#8a9a8f', marginBottom: 4 }}>Not yet risk-assessed</div><div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#b45309' }}>{unassessed}</div></div>
      </div>

      {newForm && (
        <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <div className="rgrid-2" style={{ gap: 14, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>What happened *</label>
              <textarea style={{ ...inp, minHeight: 110 }} value={String(newForm.description)} onChange={e => setNewForm({ ...newForm, description: e.target.value })} />
            </div>
            <div><label style={lbl}>Who is at risk</label><select style={inp} value={String(newForm.person_at_risk)} onChange={e => setNewForm({ ...newForm, person_at_risk: e.target.value })}>{opt(PERSON_AT_RISK)}</select></div>
            <div><label style={lbl}>Type of concern</label><select style={inp} value={String(newForm.concern_type)} onChange={e => setNewForm({ ...newForm, concern_type: e.target.value })}><option value="">—</option>{opt(CONCERN_TYPES)}</select></div>
            {(['reporter_name', 'reporter_email', 'reporter_phone', 'reporter_relationship', 'location'] as const).map(k => (
              <div key={k}><label style={lbl}>{humanise(k)}</label><input style={inp} value={String(newForm[k])} onChange={e => setNewForm({ ...newForm, [k]: e.target.value })} /></div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
              <input type="checkbox" checked={!!newForm.immediate_danger} onChange={e => setNewForm({ ...newForm, immediate_danger: e.target.checked })} /> Someone may be in immediate danger
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={btn('#8a9a8f')} onClick={() => setNewForm(null)} disabled={busy}>Cancel</button>
            <button style={btn('#1a3c2e')} onClick={logIncident} disabled={busy}>{busy ? 'Saving…' : 'Log incident'}</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No incidents logged.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d0ccc4', background: '#f5f3f0' }}>
                <th style={th}>Reference</th><th style={th}>Reported</th><th style={th}>Via</th><th style={th}>Concern</th>
                <th style={th}>Risk</th><th style={th}>Status</th><th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <IncidentRow key={r.id} r={r} isOpen={openId === r.id} onToggle={() => open(r)}>
                  {openId === r.id && triage && (
                    <IncidentDetail r={r} triage={triage} setTriage={setTriage} busy={busy} isDirector={isDirector}
                      onSave={() => saveTriage(r.id)}
                      onDelete={() => confirm(`Delete ${r.reference}? Safeguarding records should normally be kept. This cannot be undone.`)
                        && act(() => send(`/api/admin/whf-cio/safeguarding/${r.id}`, 'DELETE'), 'Deleted.').then(ok => { if (ok) setOpenId(null) })} />
                  )}
                </IncidentRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {team && (
        <div style={{ marginTop: 32, padding: 20, border: '1px solid #e8e4dc', borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '.95rem' }}>Designated safeguarding team</h3>
          <p style={{ margin: '0 0 14px', fontSize: '.8rem', color: '#8a9a8f' }}>
            These people can sign in and see this tab, and nothing else in the admin panel. {isDirector ? 'Only directors can change the list.' : 'Ask a director to change the list.'}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', marginBottom: 14 }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e8e4dc' }}>
                <td style={td}><strong>{team.lead.email}</strong><div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>Designated Safeguarding Lead</div></td>
                <td style={td}><LoginBadge has={team.lead.has_account} /></td>
                <td style={{ ...td, textAlign: 'right' }}>
                  {isDirector && !team.lead.has_account && <button style={btn('#1a3c2e')} disabled={busy} onClick={() => addMember(team.lead.email, 'Safeguarding Lead')}>Set up login</button>}
                </td>
              </tr>
              {team.members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #e8e4dc' }}>
                  <td style={td}>{m.name ? <><strong>{m.name}</strong> · </> : null}{m.email}{m.role_title && <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{m.role_title}</div>}</td>
                  <td style={td}><LoginBadge has={m.has_account} /></td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isDirector && !m.has_account && <button style={{ ...btn('#1a3c2e'), marginRight: 6 }} disabled={busy} onClick={() => addMember(m.email, m.name ?? undefined, m.role_title ?? undefined)}>Set up login</button>}
                    {isDirector && <button style={btn('#dc2626')} disabled={busy} onClick={() => confirm(`Remove ${m.email} from the safeguarding team?`) && act(() => send(`/api/admin/whf-cio/safeguarding/team/${m.id}`, 'DELETE'), 'Removed.')}>Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isDirector && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: 8, alignItems: 'end' }}>
              <div><label style={lbl}>Email *</label><input style={inp} type="email" value={member.email} onChange={e => setMember({ ...member, email: e.target.value })} /></div>
              <div><label style={lbl}>Name</label><input style={inp} value={member.name} onChange={e => setMember({ ...member, name: e.target.value })} /></div>
              <div><label style={lbl}>Role</label><input style={inp} value={member.role_title} placeholder="e.g. Deputy DSL" onChange={e => setMember({ ...member, role_title: e.target.value })} /></div>
              <button style={btn('#1a3c2e')} disabled={busy || !member.email.trim()} onClick={() => addMember(member.email.trim(), member.name.trim(), member.role_title.trim())}>Add</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoginBadge({ has }: { has: boolean }) {
  return has ? <Badge tone="green">Has a login</Badge> : <Badge tone="amber">No login yet</Badge>
}

function IncidentRow({ r, isOpen, onToggle, children }: { r: Incident; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <>
      <tr style={{ borderBottom: '1px solid #e8e4dc', background: isOpen ? '#fffdf5' : undefined }}>
        <td style={{ ...td, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {r.reference}{r.immediate_danger && <div><Badge tone="red">Immediate danger</Badge></div>}
        </td>
        <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtDate(r.reported_at)}</td>
        <td style={td}>{SOURCE_LABELS[r.source] ?? r.source}</td>
        <td style={td}>{r.concern_type ? humanise(r.concern_type) : '—'}<div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{humanise(r.person_at_risk)}</div></td>
        <td style={td}><Badge tone={RISK_TONE[r.risk_level] ?? 'grey'}>{humanise(r.risk_level)}</Badge></td>
        <td style={td}><Badge tone={STATUS_TONE[r.status] ?? 'grey'}>{humanise(r.status)}</Badge></td>
        <td style={{ ...td, textAlign: 'center' }}>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#0F2D1D', cursor: 'pointer', textDecoration: 'underline', fontSize: '.8rem' }}>{isOpen ? 'Close' : 'Open'}</button>
        </td>
      </tr>
      {children && <tr><td colSpan={7} style={{ padding: 0 }}>{children}</td></tr>}
    </>
  )
}

function IncidentDetail({ r, triage, setTriage, busy, isDirector, onSave, onDelete }: {
  r: Incident; triage: Triage; setTriage: (t: Triage) => void; busy: boolean; isDirector: boolean; onSave: () => void; onDelete: () => void
}) {
  const set = (k: keyof Triage, v: string) => setTriage({ ...triage, [k]: v })
  const reporter = [r.reporter_name, r.reporter_email, r.reporter_phone].filter(Boolean).join(' · ')
  return (
    <div style={{ padding: '16px 20px', background: '#fffdf5', borderBottom: '2px solid #e8e4dc' }}>
      <div style={{ fontSize: '.85rem', marginBottom: 14 }}>
        <div style={{ ...lbl, marginBottom: 6 }}>Report</div>
        <div style={{ whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 12 }}>{r.description}</div>
        <div style={{ marginTop: 8, color: '#4a5a4f' }}>
          Reported by: {reporter || 'anonymous'}{r.reporter_relationship ? ` (${String(r.reporter_relationship)})` : ''}
          {r.location ? <> · Where: {String(r.location)}</> : null}
          {r.source_ref ? <> · Source ref: <code>{String(r.source_ref)}</code></> : null}
          {r.created_by ? <> · Logged by {String(r.created_by)}</> : null}
        </div>
      </div>
      <div className="rgrid-2" style={{ gap: 14, marginBottom: 16 }}>
        <div><label style={lbl}>Status</label><select style={inp} value={triage.status} onChange={e => set('status', e.target.value)}>{opt(INCIDENT_STATUSES)}</select></div>
        <div><label style={lbl}>Risk level</label><select style={inp} value={triage.risk_level} onChange={e => set('risk_level', e.target.value)}>{opt(RISK_LEVELS)}</select></div>
        <div><label style={lbl}>Type of concern</label><select style={inp} value={triage.concern_type} onChange={e => set('concern_type', e.target.value)}><option value="">—</option>{opt(CONCERN_TYPES)}</select></div>
        <div><label style={lbl}>Who is at risk</label><select style={inp} value={triage.person_at_risk} onChange={e => set('person_at_risk', e.target.value)}>{opt(PERSON_AT_RISK)}</select></div>
        <div><label style={lbl}>Assigned to</label><input style={inp} value={triage.assigned_to} onChange={e => set('assigned_to', e.target.value)} /></div>
        <div><label style={lbl}>Referred to</label><input style={inp} value={triage.referred_to} placeholder="e.g. local authority LADO, police" onChange={e => set('referred_to', e.target.value)} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Actions taken</label><textarea style={{ ...inp, minHeight: 90 }} value={triage.actions_taken} placeholder="Dated notes of what was done and by whom" onChange={e => set('actions_taken', e.target.value)} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Outcome</label><textarea style={{ ...inp, minHeight: 60 }} value={triage.outcome} onChange={e => set('outcome', e.target.value)} /></div>
        <div><label style={lbl}>Closed on</label><input style={inp} type="date" value={triage.closed_on} onChange={e => set('closed_on', e.target.value)} /></div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <div>{isDirector && <button style={btn('#dc2626')} onClick={onDelete} disabled={busy}>Delete</button>}</div>
        <button style={btn('#1a3c2e')} onClick={onSave} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}
