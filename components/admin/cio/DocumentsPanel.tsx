'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { inp, lbl, btn, th, td, fmtDate, humanise } from '../cio-ui'
import Badge from './Badge'

interface Doc {
  id: string
  title: string
  category: string | null
  linked_type: string | null
  file_name: string
  size_bytes: number | null
  is_working_copy: boolean
  uploaded_by: string | null
  drive_status: 'pending' | 'synced' | 'failed' | 'disabled'
  created_at: string
}

interface Props {
  linkedType?: string
  linkedId?: string
  heading?: string
  /** Show a "working copy" control (the signed PDF everyone goes by). */
  workingCopy?: boolean
  /** Show category entry, used by the general Documents tab. */
  categories?: boolean
}

const API = '/api/admin/whef-cio/documents'
const size = (n: number | null) => (n == null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

export default function DocumentsPanel({ linkedType, linkedId, heading, workingCopy, categories }: Props) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const query = new URLSearchParams()
  if (linkedType) query.set('linked_type', linkedType)
  if (linkedId) query.set('linked_id', linkedId)
  const qs = query.toString()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ''}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load documents')
      setDocs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoaded(true)
    }
  }, [qs])

  useEffect(() => { load() }, [load])

  async function request(url: string, init: RequestInit) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(url, init)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Request failed')
      }
      await load()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function upload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Choose a file to upload'); return }
    const form = new FormData()
    form.set('file', file)
    if (title.trim()) form.set('title', title.trim())
    if (category.trim()) form.set('category', category.trim())
    if (linkedType) form.set('linked_type', linkedType)
    if (linkedId) form.set('linked_id', linkedId)
    if (await request(API, { method: 'POST', body: form })) {
      setTitle('')
      setCategory('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ border: '1px solid #e8e4dc', borderRadius: 8, padding: 16, background: '#fff' }}>
      {heading && <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', fontWeight: 600 }}>{heading}</h3>}

      {error && <div role="alert" style={{ marginBottom: 12, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>}

      <div className="rgrid-2" style={{ gap: 12, marginBottom: 14, alignItems: 'end' }}>
        <div>
          <label style={lbl}>File (PDF, PNG, JPG or DOCX, up to 4 MB)</label>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" style={inp} />
        </div>
        <div>
          <label style={lbl}>Title</label>
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Defaults to the file name" />
        </div>
        {categories && (
          <div>
            <label style={lbl}>Category</label>
            <input style={inp} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Trustee ID, Acceptance form" />
          </div>
        )}
        <div>
          <button type="button" style={btn('#1a3c2e')} onClick={upload} disabled={busy}>{busy ? 'Working…' : 'Upload'}</button>
        </div>
      </div>

      {!loaded ? (
        <div style={{ color: '#8a9a8f', fontSize: '.85rem' }}>Loading documents…</div>
      ) : docs.length === 0 ? (
        <div style={{ color: '#8a9a8f', fontSize: '.85rem' }}>No documents uploaded yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d0ccc4', background: '#f5f3f0' }}>
                <th style={th}>Document</th>
                {categories && <th style={th}>Category</th>}
                <th style={th}>Uploaded</th>
                <th style={th}>Backup</th>
                <th style={{ ...th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #e8e4dc' }}>
                  <td style={td}>
                    <a href={`${API}/${d.id}/file`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, color: '#0F2D1D' }}>{d.title}</a>
                    {d.is_working_copy && <span style={{ marginLeft: 8 }}><Badge tone="green">Working copy</Badge></span>}
                    <div style={{ fontSize: '.72rem', color: '#8a9a8f' }}>
                      {d.file_name} · {size(d.size_bytes)}{!linkedType && d.linked_type ? ` · ${humanise(d.linked_type)}` : ''}
                    </div>
                  </td>
                  {categories && <td style={td}>{d.category || '—'}</td>}
                  <td style={td}>{fmtDate(d.created_at)}<div style={{ fontSize: '.72rem', color: '#8a9a8f' }}>{d.uploaded_by}</div></td>
                  <td style={td}>
                    <Badge tone={d.drive_status === 'synced' ? 'green' : d.drive_status === 'failed' ? 'red' : 'grey'}>
                      {d.drive_status === 'synced' ? 'In Drive' : d.drive_status === 'failed' ? 'Failed' : d.drive_status === 'disabled' ? 'Off' : 'Pending'}
                    </Badge>
                  </td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {workingCopy && !d.is_working_copy && (
                      <button type="button" disabled={busy} onClick={() => request(`${API}/${d.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_working_copy: true }) })}
                        style={{ background: 'none', border: 'none', color: '#0F2D1D', cursor: 'pointer', textDecoration: 'underline', fontSize: '.78rem', marginRight: 10 }}>Make working copy</button>
                    )}
                    {deleting === d.id ? (
                      <>
                        <button type="button" disabled={busy} onClick={async () => { await request(`${API}/${d.id}`, { method: 'DELETE' }); setDeleting(null) }} style={{ ...btn('#dc2626'), padding: '3px 10px' }}>Yes, delete</button>
                        <button type="button" onClick={() => setDeleting(null)} style={{ ...btn('#8a9a8f'), padding: '3px 10px', marginLeft: 6 }}>No</button>
                      </>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => setDeleting(d.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline', fontSize: '.78rem' }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
