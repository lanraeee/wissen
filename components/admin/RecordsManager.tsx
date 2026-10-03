'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { inp, lbl, btn, th, td, dateInput, type Row } from './cio-ui'

export interface Field {
  name: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select' | 'checkbox' | 'number'
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
  full?: boolean
}

export interface Column {
  key: string
  label: string
  render?: (row: Row) => ReactNode
}

interface Props {
  resource: string
  heading: string
  blurb?: string
  addLabel: string
  emptyText: string
  fields: Field[]
  columns: Column[]
  defaults?: Record<string, unknown>
  summary?: (rows: Row[]) => ReactNode
  renderExtra?: (row: Row) => ReactNode
}

export default function RecordsManager({ resource, heading, blurb, addLabel, emptyText, fields, columns, defaults = {}, summary, renderExtra }: Props) {
  const api = `/api/admin/whef-cio/${resource}`
  const [rows, setRows] = useState<Row[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, unknown> | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(api)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setRows(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoaded(true)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingId(null)
    setForm({ ...defaults })
    setConfirmDelete(false)
    setError('')
  }

  function openEdit(row: Row) {
    const f: Record<string, unknown> = {}
    for (const field of fields) {
      const v = row[field.name]
      f[field.name] = field.type === 'date' ? dateInput(v) : v ?? (field.type === 'checkbox' ? false : '')
    }
    setEditingId(row.id)
    setForm(f)
    setConfirmDelete(false)
    setError('')
  }

  function close() {
    setForm(null)
    setEditingId(null)
    setConfirmDelete(false)
    setError('')
  }

  async function call(url: string, method: string, body?: unknown) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Request failed')
      }
      await load()
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSaving(false)
    }
  }

  function save() {
    if (!form) return
    const missing = fields.find(f => f.required && (form[f.name] === undefined || form[f.name] === ''))
    if (missing) { setError(`${missing.label} is required`); return }
    call(editingId ? `${api}/${editingId}` : api, editingId ? 'PUT' : 'POST', form)
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const editingRow = editingId ? rows.find(r => r.id === editingId) : undefined

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{heading}</h2>
          {blurb && <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>{blurb}</p>}
        </div>
        <button style={btn('#1a3c2e')} onClick={openNew} disabled={form !== null}>{addLabel}</button>
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>
      )}

      {form && (
        <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <div className="rgrid-2" style={{ gap: 14, marginBottom: 16 }}>
            {fields.map(f => (
              <div key={f.name} style={f.full || f.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>
                {f.type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
                    <input type="checkbox" checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked })} />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label style={lbl}>{f.label}{f.required ? ' *' : ''}</label>
                    {f.type === 'textarea' ? (
                      <textarea style={{ ...inp, minHeight: 90 }} value={String(form[f.name] ?? '')} placeholder={f.placeholder}
                        onChange={e => setForm({ ...form, [f.name]: e.target.value })} />
                    ) : f.type === 'select' ? (
                      <select style={inp} value={String(form[f.name] ?? '')} onChange={e => setForm({ ...form, [f.name]: e.target.value })}>
                        {!f.required && <option value="">—</option>}
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input style={inp} type={f.type === 'number' ? 'number' : f.type} value={String(form[f.name] ?? '')} placeholder={f.placeholder}
                        onChange={e => setForm({ ...form, [f.name]: e.target.value })} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {editingRow && renderExtra && <div style={{ marginBottom: 16 }}>{renderExtra(editingRow)}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <div>{editingId && <button style={btn('#dc2626')} onClick={() => setConfirmDelete(true)} disabled={saving}>Delete</button>}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn('#8a9a8f')} onClick={close} disabled={saving}>Cancel</button>
              <button style={btn('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>

          {confirmDelete && editingId && (
            <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 6 }}>
              <p style={{ margin: '0 0 12px', color: '#991b1b', fontSize: '.9rem', fontWeight: 500 }}>Delete this record? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={btn('#8a9a8f')} onClick={() => setConfirmDelete(false)} disabled={saving}>Cancel</button>
                <button style={btn('#dc2626')} onClick={() => call(`${api}/${editingId}`, 'DELETE')} disabled={saving}>{saving ? 'Deleting…' : 'Yes, delete'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>{emptyText}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d0ccc4', background: '#f5f3f0' }}>
                {columns.map(c => <th key={c.key} style={th}>{c.label}</th>)}
                <th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #e8e4dc' }}>
                  {columns.map(c => <td key={c.key} style={td}>{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>)}
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button onClick={() => openEdit(row)} style={{ background: 'none', border: 'none', color: '#0F2D1D', cursor: 'pointer', textDecoration: 'underline', fontSize: '.8rem' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary && rows.length > 0 && <div style={{ marginTop: 24 }}>{summary(rows)}</div>}
    </div>
  )
}
