'use client'

import RecordsManager, { type Field, type Column } from '../RecordsManager'
import { humanise, type Row } from '../cio-ui'
import Badge from './Badge'
import { BILLING_CYCLES, COST_CATEGORIES, CURRENCIES, formatMoney, monthlyEquivalent, monthlyTotals } from '@/lib/ledger-shared'

const opts = (vs: readonly string[]) => vs.map(v => ({ value: v, label: humanise(v) }))

const FIELDS: Field[] = [
  { name: 'name', label: 'Cost', type: 'text', required: true, placeholder: 'e.g. Website hosting (Azure App Service)' },
  { name: 'category', label: 'Category', type: 'select', required: true, options: opts(COST_CATEGORIES) },
  { name: 'supplier', label: 'Supplier', type: 'text', placeholder: 'e.g. Microsoft, Google Workspace, accountant' },
  { name: 'amount', label: 'Amount per billing cycle', type: 'number', required: true },
  { name: 'currency', label: 'Currency', type: 'select', required: true, options: CURRENCIES.map(c => ({ value: c, label: c })) },
  { name: 'billing_cycle', label: 'Billed', type: 'select', required: true, options: opts(BILLING_CYCLES) },
  { name: 'is_active', label: 'Currently paying for this', type: 'checkbox' },
  { name: 'is_public', label: 'Show on the public transparency page', type: 'checkbox' },
  { name: 'notes', label: 'Notes (directors only)', type: 'textarea' },
]

const COLUMNS: Column[] = [
  { key: 'name', label: 'Cost' },
  { key: 'category', label: 'Category', render: r => humanise(r.category) },
  { key: 'supplier', label: 'Supplier', render: r => String(r.supplier || '—') },
  { key: 'amount', label: 'Billed', render: r => `${formatMoney(r.amount as string, String(r.currency))} ${r.billing_cycle === 'monthly' ? '/ month' : r.billing_cycle === 'annual' ? '/ year' : '/ quarter'}` },
  { key: 'monthly', label: 'Per month', render: r => formatMoney(monthlyEquivalent(r.amount as string, String(r.billing_cycle)), String(r.currency)) },
  {
    key: 'status', label: 'Status', render: r => (
      <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
        {r.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Stopped</Badge>}
        {!r.is_public && <Badge tone="amber">Private</Badge>}
      </span>
    ),
  },
]

function summary(rows: Row[]) {
  const totals = monthlyTotals(rows as unknown as Parameters<typeof monthlyTotals>[0])
  return (
    <div style={{ padding: 20, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', fontWeight: 600 }}>What it costs to run the foundation each month</h3>
      {totals.length === 0 ? (
        <p style={{ margin: 0, fontSize: '.85rem', color: '#8a9a8f' }}>No active costs.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, fontSize: '.85rem' }}>
          {totals.map(t => (
            <div key={t.currency}>
              <div style={{ color: '#8a9a8f', marginBottom: 4 }}>{t.currency} per month</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0F2D1D' }}>{formatMoney(t.monthly, t.currency)}</div>
            </div>
          ))}
        </div>
      )}
      <p style={{ margin: '12px 0 0', fontSize: '.78rem', color: '#8a9a8f' }}>
        Annual and quarterly bills are spread across the months. Currencies are not converted. Public at{' '}
        <a href="/transparency/costs" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>/transparency/costs</a>.
      </p>
    </div>
  )
}

export default function FixedCostsTab() {
  return (
    <RecordsManager
      resource="fixed_costs"
      heading="Operational Fixed Costs"
      blurb="The core tools, services and admin the foundation cannot run at full efficiency without. Leave out optional overheads such as advertising."
      addLabel="+ Add cost"
      emptyText="No running costs recorded yet."
      fields={FIELDS}
      columns={COLUMNS}
      defaults={{ category: 'tools', currency: 'GBP', billing_cycle: 'monthly', is_active: true, is_public: true }}
      summary={summary}
      summaryWhenEmpty
    />
  )
}
