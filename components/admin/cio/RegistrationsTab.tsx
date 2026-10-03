'use client'

import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { fmtDate } from '../cio-ui'

const AUTHORITIES = [
  { value: 'charity_commission', label: 'Charity Commission (CIO)' },
  { value: 'companies_house', label: 'Companies House (Wissen-Haus Ltd)' },
  { value: 'cac', label: 'CAC (Nigeria)' },
  { value: 'tin', label: 'Tax ID (TIN)' },
  { value: 'other', label: 'Other' },
]
const label = (v: unknown) => AUTHORITIES.find(a => a.value === v)?.label ?? String(v ?? '—')

const FIELDS: Field[] = [
  { name: 'authority', label: 'Registered with', type: 'select', required: true, options: AUTHORITIES },
  { name: 'entity_name', label: 'Entity name', type: 'text', required: true, placeholder: 'e.g. Wissen-Haus Empowerment Foundation' },
  { name: 'reg_number', label: 'Registration number', type: 'text' },
  { name: 'status', label: 'Status', type: 'text', placeholder: 'e.g. Application submitted, Registered' },
  { name: 'registered_date', label: 'Registered / filed on', type: 'date' },
  { name: 'registered_address', label: 'Registered address', type: 'text', full: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

const COLUMNS: Column[] = [
  { key: 'authority', label: 'Registered with', render: r => label(r.authority) },
  { key: 'entity_name', label: 'Entity' },
  { key: 'reg_number', label: 'Number', render: r => String(r.reg_number || '—') },
  { key: 'status', label: 'Status', render: r => String(r.status || '—') },
  { key: 'registered_date', label: 'Date', render: r => fmtDate(r.registered_date) },
]

export default function RegistrationsTab() {
  return (
    <RecordsManager
      resource="registrations"
      heading="Registrations"
      blurb="Where each entity is registered. The CIO is registered with the Charity Commission only; Companies House applies to Wissen-Haus Ltd (UK)."
      addLabel="+ Add registration"
      emptyText="No registrations recorded yet."
      fields={FIELDS}
      columns={COLUMNS}
      defaults={{ authority: 'charity_commission' }}
    />
  )
}
