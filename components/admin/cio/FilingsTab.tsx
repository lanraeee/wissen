'use client'

import DocumentsPanel from './DocumentsPanel'
import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { fmtDate, daysUntil, humanise, type Row } from '../cio-ui'
import Badge from './Badge'

const STATUSES = ['upcoming', 'submitted', 'not_required'].map(v => ({ value: v, label: humanise(v) }))

const FIELDS: Field[] = [
  { name: 'title', label: 'Filing', type: 'text', required: true, placeholder: 'e.g. Charity annual return' },
  { name: 'authority', label: 'Authority', type: 'text', placeholder: 'e.g. Charity Commission, HMRC, Companies House' },
  { name: 'due_date', label: 'Due date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
  { name: 'submitted_date', label: 'Submitted on', type: 'date' },
  { name: 'reference', label: 'Reference', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

function state(r: Row): { tone: 'green' | 'red' | 'amber' | 'grey'; label: string } {
  if (r.status === 'submitted') return { tone: 'green', label: 'Submitted' }
  if (r.status === 'not_required') return { tone: 'grey', label: 'Not required' }
  const d = daysUntil(r.due_date)
  if (d !== null && d < 0) return { tone: 'red', label: `Overdue (${-d}d)` }
  if (d !== null && d <= 60) return { tone: 'amber', label: `Due in ${d}d` }
  return { tone: 'grey', label: 'Upcoming' }
}

const COLUMNS: Column[] = [
  { key: 'title', label: 'Filing' },
  { key: 'authority', label: 'Authority', render: r => String(r.authority || '—') },
  { key: 'due_date', label: 'Due', render: r => fmtDate(r.due_date) },
  { key: 'status', label: 'Status', render: r => { const s = state(r); return <Badge tone={s.tone}>{s.label}</Badge> } },
  { key: 'reference', label: 'Reference', render: r => String(r.reference || '—') },
]

function summary(rows: Row[]) {
  const open = rows.filter(r => r.status === 'upcoming')
  const overdue = open.filter(r => (daysUntil(r.due_date) ?? 1) < 0).length
  const soon = open.filter(r => { const d = daysUntil(r.due_date); return d !== null && d >= 0 && d <= 60 }).length
  const stat = (label: string, value: number, color: string) => (
    <div><div style={{ color: '#8a9a8f', marginBottom: 4 }}>{label}</div><div style={{ fontSize: '1.3rem', fontWeight: 600, color }}>{value}</div></div>
  )
  return (
    <div style={{ padding: 20, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', fontWeight: 600 }}>Compliance summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, fontSize: '.85rem' }}>
        {stat('Open filings', open.length, '#0F2D1D')}
        {stat('Due within 60 days', soon, '#b45309')}
        {stat('Overdue', overdue, '#dc2626')}
      </div>
    </div>
  )
}

export default function FilingsTab() {
  return (
    <RecordsManager
      resource="filings"
      heading="Filings & Compliance"
      blurb="Annual return, accounts and other statutory deadlines, so none is missed."
      addLabel="+ Add filing"
      emptyText="No filings recorded yet."
      fields={FIELDS}
      renderExtra={row => <DocumentsPanel linkedType="filings" linkedId={row.id} heading="Attached documents" />}
      columns={COLUMNS}
      defaults={{ status: 'upcoming' }}
      summary={summary}
    />
  )
}
