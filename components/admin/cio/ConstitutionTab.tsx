'use client'

import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { inp, lbl, btn, th, td, fmtDate, humanise } from '../cio-ui'
import Badge from './Badge'
import DocumentsPanel from './DocumentsPanel'
import ConstitutionPreview from './ConstitutionPreview'

interface Version {
  id: string
  version_label: string
  status: 'draft' | 'adopted' | 'superseded'
  body_text: string | null
  adopted_date: string | null
  change_summary: string | null
  created_by: string | null
  created_at: string
}

interface WorkingCopy { id: string; title: string; linked_id: string | null; file_name: string }

const API = '/api/admin/whef-cio/constitution'
const TONE = { draft: 'amber', adopted: 'green', superseded: 'grey' } as const

export default function ConstitutionTab() {
  const [versions, setVersions] = useState<Version[]>([])
  const [working, setWorking] = useState<WorkingCopy | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ version_label: '', change_summary: '', body_text: '' })
  const [newLabel, setNewLabel] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'adopt' | 'delete' | null>(null)
  const [adoptDate, setAdoptDate] = useState('')
  const previewText = useDeferredValue(draft.body_text)

  const load = useCallback(async () => {
    try {
      const [v, d] = await Promise.all([fetch(API), fetch('/api/admin/whef-cio/documents?linked_type=constitution')])
      const vd = await v.json().catch(() => null)
      if (!v.ok) throw new Error(vd?.error || 'Failed to load constitution')
      setVersions(vd)
      const dd = d.ok ? await d.json().catch(() => []) : []
      setWorking((dd as (WorkingCopy & { is_working_copy: boolean })[]).find(x => x.is_working_copy) ?? null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load constitution')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function call(url: string, method: string, body?: unknown, after?: () => void) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      await load()
      after?.()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  function open(v: Version) {
    setOpenId(v.id)
    setDraft({ version_label: v.version_label, change_summary: v.change_summary ?? '', body_text: v.body_text ?? '' })
    setConfirm(null)
    setError('')
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const current = versions.find(v => v.id === openId)
  const adopted = versions.find(v => v.status === 'adopted')
  const workingVersion = working && versions.find(v => v.id === working.linked_id)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Constitution</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>
            Versioned text for editing and review. The signed PDF marked as the working copy is the one everyone goes by.
          </p>
        </div>
        <button style={btn('#1a3c2e')} onClick={() => setNewLabel(newLabel === null ? '' : null)} disabled={busy}>+ New version</button>
      </div>

      {error && <div role="alert" style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: working ? '#f0fdf4' : '#fffbeb', border: `1px solid ${working ? '#bbf7d0' : '#fde68a'}`, fontSize: '.85rem' }}>
        {working ? (
          <>
            <strong>Working copy:</strong>{' '}
            <a href={`/api/admin/whef-cio/documents/${working.id}/file`} target="_blank" rel="noopener noreferrer" style={{ color: '#0F2D1D' }}>{working.title}</a>
            {workingVersion ? ` (${workingVersion.version_label})` : ''}
            {adopted && workingVersion && adopted.id !== workingVersion.id && (
              <div style={{ marginTop: 4, color: '#b45309' }}>The adopted version is {adopted.version_label}, but the working copy is for {workingVersion.version_label}.</div>
            )}
          </>
        ) : (
          <>No signed PDF is marked as the working copy yet. Open a version, upload the signed PDF and choose <em>Make working copy</em>.</>
        )}
      </div>

      {newLabel !== null && (
        <div style={{ marginBottom: 20, padding: 16, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8 }}>
          <label style={lbl}>Version label *</label>
          <input style={{ ...inp, maxWidth: 320, marginBottom: 12 }} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. v1.0" />
          <p style={{ margin: '0 0 12px', fontSize: '.78rem', color: '#8a9a8f' }}>
            {adopted ? `The new draft starts as a copy of the adopted version (${adopted.version_label}).` : 'The new draft starts empty.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btn('#1a3c2e')} disabled={busy || !newLabel.trim()} onClick={async () => {
              const v = await call(API, 'POST', { version_label: newLabel, copy_from: adopted?.id }, () => setNewLabel(null))
              if (v?.id) open(v)
            }}>Create draft</button>
            <button style={btn('#8a9a8f')} onClick={() => setNewLabel(null)}>Cancel</button>
          </div>
        </div>
      )}

      {versions.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No versions yet. Create the first one to start.</div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d0ccc4', background: '#f5f3f0' }}>
                <th style={th}>Version</th><th style={th}>Status</th><th style={th}>Adopted</th><th style={th}>Summary of changes</th><th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #e8e4dc', background: v.id === openId ? '#fafaf5' : undefined }}>
                  <td style={{ ...td, fontWeight: 500 }}>{v.version_label}</td>
                  <td style={td}><Badge tone={TONE[v.status]}>{humanise(v.status)}</Badge></td>
                  <td style={td}>{fmtDate(v.adopted_date)}</td>
                  <td style={td}>{v.change_summary || '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button onClick={() => (v.id === openId ? setOpenId(null) : open(v))} style={{ background: 'none', border: 'none', color: '#0F2D1D', cursor: 'pointer', textDecoration: 'underline', fontSize: '.8rem' }}>
                      {v.id === openId ? 'Close' : v.status === 'draft' ? 'Edit' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {current && (
        <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1rem' }}>
            {current.version_label} <Badge tone={TONE[current.status]}>{humanise(current.status)}</Badge>
          </h3>
          {current.status !== 'draft' && (
            <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: '#8a9a8f' }}>
              {humanise(current.status)} versions are a permanent record and can’t be edited. To change the constitution, create a new draft.
            </p>
          )}
          <div className="rgrid-2" style={{ gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Version label</label>
              <input style={inp} disabled={current.status !== 'draft'} value={draft.version_label} onChange={e => setDraft({ ...draft, version_label: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Summary of changes</label>
              <input style={inp} disabled={current.status !== 'draft'} value={draft.change_summary} onChange={e => setDraft({ ...draft, change_summary: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Constitution text</label>
              <textarea style={{ ...inp, minHeight: 360, fontFamily: 'ui-monospace, monospace', lineHeight: 1.5 }} disabled={current.status !== 'draft'}
                value={draft.body_text} onChange={e => setDraft({ ...draft, body_text: e.target.value })} placeholder="Paste or write the constitution here." />
            </div>
          </div>

          {current.status === 'draft' && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 14 }}>
              <button style={btn('#dc2626')} disabled={busy} onClick={() => setConfirm('delete')}>Delete draft</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn('#1a3c2e')} disabled={busy} onClick={() => call(`${API}/${current.id}`, 'PUT', draft)}>{busy ? 'Saving…' : 'Save draft'}</button>
                <button style={btn('#b8952a')} disabled={busy} onClick={() => setConfirm('adopt')}>Adopt this version</button>
              </div>
            </div>
          )}
          {current.status !== 'draft' && (
            <div style={{ marginBottom: 14 }}>
              <button style={btn('#1a3c2e')} disabled={busy} onClick={async () => {
                const v = await call(API, 'POST', { version_label: `${current.version_label}-draft`, copy_from: current.id })
                if (v?.id) open(v)
              }}>New draft from this version</button>
            </div>
          )}

          {confirm === 'adopt' && (
            <div style={{ marginBottom: 14, padding: 12, background: '#fef3c7', border: '1px solid #b45309', borderRadius: 6 }}>
              <p style={{ margin: '0 0 10px', fontSize: '.88rem', color: '#78350f' }}>
                Adopting makes this version permanent and supersedes {adopted ? adopted.version_label : 'any previous version'}. Save your edits first.
              </p>
              <label style={lbl}>Adoption date (defaults to today)</label>
              <input style={{ ...inp, maxWidth: 200, marginBottom: 10 }} type="date" value={adoptDate} onChange={e => setAdoptDate(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={btn('#8a9a8f')} onClick={() => setConfirm(null)}>Cancel</button>
                <button style={btn('#b8952a')} disabled={busy} onClick={() => call(`${API}/${current.id}/adopt`, 'POST', adoptDate ? { adopted_date: adoptDate } : {}, () => { setConfirm(null); setOpenId(null) })}>Yes, adopt</button>
              </div>
            </div>
          )}
          {confirm === 'delete' && (
            <div style={{ marginBottom: 14, padding: 12, background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 6 }}>
              <p style={{ margin: '0 0 10px', fontSize: '.88rem', color: '#991b1b' }}>Delete this draft? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={btn('#8a9a8f')} onClick={() => setConfirm(null)}>Cancel</button>
                <button style={btn('#dc2626')} disabled={busy} onClick={() => call(`${API}/${current.id}`, 'DELETE', undefined, () => { setConfirm(null); setOpenId(null) })}>Yes, delete</button>
              </div>
            </div>
          )}

          <div style={{ margin: '4px 0 20px' }}>
            <ConstitutionPreview source={previewText} versionLabel={draft.version_label} status={current.status} adoptedDate={current.adopted_date} />
          </div>

          <DocumentsPanel linkedType="constitution" linkedId={current.id} heading="Signed copies" workingCopy onChange={load} />
        </div>
      )}
    </div>
  )
}
