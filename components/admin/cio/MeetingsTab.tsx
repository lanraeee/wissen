'use client'

import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { fmtDate, humanise } from '../cio-ui'
import Badge from './Badge'

const TYPES = [
  { value: 'trustee', label: 'Trustee meeting' },
  { value: 'general', label: 'General meeting' },
  { value: 'written_resolution', label: 'Written resolution' },
]
const STATUSES = ['scheduled', 'held', 'cancelled'].map(v => ({ value: v, label: humanise(v) }))

const FIELDS: Field[] = [
  { name: 'meeting_date', label: 'Date', type: 'date', required: true },
  { name: 'meeting_type', label: 'Type', type: 'select', required: true, options: TYPES },
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. First trustee meeting' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
  { name: 'location', label: 'Location / link', type: 'text', placeholder: 'Address or video-call link' },
  { name: 'attendees', label: 'Attendees & apologies', type: 'textarea' },
  { name: 'minutes', label: 'Minutes', type: 'textarea', placeholder: 'Record decisions, actions and any declared conflicts.' },
]

const COLUMNS: Column[] = [
  { key: 'meeting_date', label: 'Date', render: r => fmtDate(r.meeting_date) },
  { key: 'meeting_type', label: 'Type', render: r => TYPES.find(t => t.value === r.meeting_type)?.label ?? humanise(r.meeting_type) },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status', render: r => <Badge tone={r.status === 'held' ? 'green' : r.status === 'cancelled' ? 'grey' : 'amber'}>{humanise(r.status)}</Badge> },
]

export default function MeetingsTab() {
  return (
    <RecordsManager
      resource="meetings"
      heading="Meetings & Minutes"
      blurb="Trustee and general meetings and written resolutions, with their minutes. Attach signed minutes as documents."
      addLabel="+ Add meeting"
      emptyText="No meetings recorded yet."
      fields={FIELDS}
      columns={COLUMNS}
      defaults={{ meeting_type: 'trustee', status: 'scheduled' }}
    />
  )
}
