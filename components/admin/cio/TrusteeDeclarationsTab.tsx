'use client'

import { useEffect, useState } from 'react'
import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { fmtDate, type Row } from '../cio-ui'
import Badge from './Badge'
import TrusteeDeclarationPreview from './TrusteeDeclarationPreview'
import SignaturePad from './SignaturePad'
import DocumentsPanel from './DocumentsPanel'

interface Trustee { id: string; full_name: string; position_title: string | null; status: string }

export default function TrusteeDeclarationsTab() {
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

  const fields: Field[] = [
    { name: 'trustee_id', label: 'Trustee', type: 'select', required: true, options: trustees.map(t => ({ value: t.id, label: t.full_name })) },
    { name: 'signed_date', label: 'Signed on', type: 'date', required: true },
    { name: 'confirms_eligible', label: 'Confirms not disqualified as a charity trustee (Charities Act 2011, ss178–180)', type: 'checkbox' },
    { name: 'accepts_office', label: 'Accepts appointment as a charity trustee', type: 'checkbox' },
    { name: 'consents_to_application', label: 'Consents to details being used for the Charity Commission application', type: 'checkbox' },
    { name: 'signed_name', label: 'Printed name (alongside the drawn signature below)', type: 'text', placeholder: 'As the trustee would sign it' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ]

  const columns: Column[] = [
    { key: 'full_name', label: 'Trustee' },
    { key: 'signed_date', label: 'Signed on', render: r => fmtDate(r.signed_date) },
    {
      key: 'status', label: 'Status',
      render: r => (r.confirms_eligible && r.accepts_office && r.consents_to_application
        ? <Badge tone="green">Complete</Badge>
        : <Badge tone="amber">Incomplete</Badge>),
    },
    { key: 'signed_name', label: 'Signed name', render: r => String(r.signed_name || '—') },
  ]

  function summary(rows: Row[]) {
    const done = new Set(rows.filter(r => r.confirms_eligible && r.accepts_office && r.consents_to_application).map(r => r.trustee_id))
    return (
      <div style={{ padding: 20, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', fontWeight: 600 }}>Who still needs to sign</h3>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: '.85rem' }}>
          {active.map(t => (
            <li key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ minWidth: 200 }}>{t.full_name}</span>
              {done.has(t.id) ? <Badge tone="green">Signed</Badge> : <Badge tone="red">Outstanding</Badge>}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <RecordsManager
      resource="trustee_declarations"
      heading="Trustee Declarations"
      blurb="Eligibility and acceptance-of-office declaration each trustee signs once, on appointment (constitution clauses 4.3, 5.2.5) — separate from the annual conflicts-of-interest declaration."
      addLabel="+ Add declaration"
      emptyText="No declarations recorded yet."
      fields={fields}
      columns={columns}
      defaults={{
        trustee_id: active[0]?.id ?? '',
        signed_date: new Date().toISOString().slice(0, 10),
        confirms_eligible: false,
        accepts_office: false,
        consents_to_application: false,
      }}
      summary={summary}
      summaryWhenEmpty
      renderExtra={(row, reload) => {
        const trustee = trustees.find(t => t.id === row.trustee_id)
        return (
          <>
            <SignaturePad
              resource="trustee_declarations"
              recordId={row.id}
              existing={row.signature_data as string | null}
              onSaved={reload}
            />
            <div style={{ marginBottom: 20 }}>
              <TrusteeDeclarationPreview
                fullName={trustee?.full_name ?? String(row.full_name ?? '')}
                positionTitle={trustee?.position_title}
                signedDate={row.signed_date}
                confirmsEligible={!!row.confirms_eligible}
                acceptsOffice={!!row.accepts_office}
                consentsToApplication={!!row.consents_to_application}
                signedName={row.signed_name as string | null}
                signatureData={row.signature_data as string | null}
              />
            </div>
            <DocumentsPanel linkedType="trustee_declarations" linkedId={row.id} heading="Signed copy" />
          </>
        )
      }}
    />
  )
}
