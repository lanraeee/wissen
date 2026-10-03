'use client'

import { useEffect, useState } from 'react'
import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { fmtDate, type Row } from '../cio-ui'
import Badge from './Badge'

interface Trustee { id: string; full_name: string; status: string }

export default function ConflictsTab() {
  const [trustees, setTrustees] = useState<Trustee[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/trustee-register')
      .then(async res => {
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to load trustees')
        setTrustees(data)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load trustees'))
  }, [])

  if (error) return <div role="alert" style={{ color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>{error}</div>
  if (!trustees) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  const active = trustees.filter(t => t.status === 'active')
  const year = new Date().getFullYear()

  const fields: Field[] = [
    { name: 'trustee_id', label: 'Trustee', type: 'select', required: true, options: trustees.map(t => ({ value: t.id, label: t.full_name })) },
    { name: 'declaration_year', label: 'Year', type: 'number', required: true },
    { name: 'declared_on', label: 'Declared on', type: 'date', required: true },
    { name: 'has_conflicts', label: 'Trustee has conflicts of interest to declare', type: 'checkbox' },
    { name: 'details', label: 'Details', type: 'textarea', placeholder: 'Nature of each interest, and how it will be managed. Leave blank if none.' },
  ]

  const columns: Column[] = [
    { key: 'declaration_year', label: 'Year' },
    { key: 'full_name', label: 'Trustee' },
    { key: 'declared_on', label: 'Declared on', render: r => fmtDate(r.declared_on) },
    { key: 'has_conflicts', label: 'Conflicts', render: r => (r.has_conflicts ? <Badge tone="amber">Declared</Badge> : <Badge tone="green">None</Badge>) },
    { key: 'details', label: 'Details', render: r => String(r.details || '—') },
  ]

  function summary(rows: Row[]) {
    const done = new Set(rows.filter(r => Number(r.declaration_year) === year).map(r => r.trustee_id))
    return (
      <div style={{ padding: 20, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', fontWeight: 600 }}>{year} declarations</h3>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: '.85rem' }}>
          {active.map(t => (
            <li key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ minWidth: 200 }}>{t.full_name}</span>
              {done.has(t.id) ? <Badge tone="green">Declared</Badge> : <Badge tone="red">Outstanding</Badge>}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <RecordsManager
      resource="declarations"
      heading="Conflicts of Interest"
      blurb="Each trustee declares any conflicts of interest annually, as the constitution requires."
      addLabel="+ Record declaration"
      emptyText="No declarations recorded yet."
      fields={fields}
      columns={columns}
      defaults={{
        trustee_id: active[0]?.id ?? '',
        declaration_year: year,
        declared_on: new Date().toISOString().slice(0, 10),
        has_conflicts: false,
      }}
      summary={summary}
      summaryWhenEmpty
    />
  )
}
