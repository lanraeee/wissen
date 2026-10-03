'use client'

import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { fmtDate, daysUntil, humanise, type Row } from '../cio-ui'
import Badge from './Badge'

const STATUSES = ['draft', 'adopted', 'under_review', 'retired'].map(v => ({ value: v, label: humanise(v) }))

const FIELDS: Field[] = [
  { name: 'title', label: 'Policy', type: 'text', required: true, placeholder: 'e.g. Safeguarding policy' },
  { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Safeguarding, Finance, Governance' },
  { name: 'owner', label: 'Owner', type: 'text', placeholder: 'Trustee responsible' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
  { name: 'adopted_date', label: 'Adopted on', type: 'date' },
  { name: 'review_date', label: 'Next review', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

function reviewCell(r: Row) {
  if (!r.review_date) return '—'
  const d = daysUntil(r.review_date)
  const overdue = d !== null && d < 0 && r.status !== 'retired'
  return <span style={{ color: overdue ? '#dc2626' : undefined, fontWeight: overdue ? 600 : undefined }}>{fmtDate(r.review_date)}{overdue ? ' (overdue)' : ''}</span>
}

const COLUMNS: Column[] = [
  { key: 'title', label: 'Policy' },
  { key: 'category', label: 'Category', render: r => String(r.category || '—') },
  { key: 'owner', label: 'Owner', render: r => String(r.owner || '—') },
  { key: 'status', label: 'Status', render: r => <Badge tone={r.status === 'adopted' ? 'green' : r.status === 'retired' ? 'grey' : 'amber'}>{humanise(r.status)}</Badge> },
  { key: 'review_date', label: 'Next review', render: reviewCell },
]

export default function PoliciesTab() {
  return (
    <RecordsManager
      resource="policies"
      heading="Policies"
      blurb="Policies the trustees have adopted, with an owner and review date. Attach the signed policy as a document."
      addLabel="+ Add policy"
      emptyText="No policies recorded yet."
      fields={FIELDS}
      columns={COLUMNS}
      defaults={{ status: 'draft' }}
    />
  )
}
