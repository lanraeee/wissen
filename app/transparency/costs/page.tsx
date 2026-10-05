import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { listPublicFixedCosts } from '@/lib/ledger'
import { formatMoney, monthlyEquivalent, monthlyTotals, type CostRow } from '@/lib/ledger-shared'
import { log } from '@/lib/logger'
import TransparencyShell from '@/components/TransparencyShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = pageMetadata({
  title: 'Operational Fixed Costs · Wissen-Haus',
  ogTitle: 'What it costs to run Wissen-Haus',
  description: 'What it costs each month to keep the Wissen-Haus Empowerment Foundation running: the core tools, services and admin.',
})

type Cost = CostRow & { id: string; name: string; category: string; supplier: string | null }

const CATEGORY_LABELS: Record<string, string> = { tools: 'Tools', services: 'Services', admin: 'Admin', other: 'Other' }
const CYCLE: Record<string, string> = { monthly: 'monthly', quarterly: 'quarterly', annual: 'yearly' }
const cell = { padding: '10px 8px', borderBottom: '1px solid #e8e4dc', verticalAlign: 'top' as const }

export default async function CostsPage() {
  let rows: Cost[] = []
  let failed = false
  try {
    rows = (await listPublicFixedCosts()) as unknown as Cost[]
  } catch (err) {
    log.error('transparency costs', err)
    failed = true
  }
  const totals = monthlyTotals(rows)
  const groups = Object.keys(CATEGORY_LABELS).map(k => ({ key: k, items: rows.filter(r => r.category === k) })).filter(g => g.items.length)

  return (
    <TransparencyShell
      active="costs"
      title="Operational Fixed Costs"
      intro={<>
        What it costs to keep the foundation running each month: the tools, services and admin we cannot operate at full
        efficiency without. Optional overheads such as advertising are not included. Every transaction is on the{' '}
        <Link href="/transparency/ledger" style={{ color: '#1a3c2e' }}>financial ledger</Link>.
      </>}
    >
      {failed ? (
        <p style={{ color: '#8a9a8f' }}>This page is not available right now. Please try again later.</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#8a9a8f' }}>Our running costs have not been published yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
            {totals.map(t => (
              <div key={t.currency} style={{ background: '#1a3c2e', color: '#f4f0e7', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', opacity: .7, marginBottom: 6 }}>Per month, {t.currency}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{formatMoney(t.monthly, t.currency)}</div>
              </div>
            ))}
          </div>
          {groups.map(g => (
            <div key={g.key} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.05rem', color: '#0f2d1d', margin: '0 0 8px' }}>{CATEGORY_LABELS[g.key]}</h2>
              <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e8e4dc', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem', minWidth: 480 }}>
                  <tbody>
                    {g.items.map(r => (
                      <tr key={r.id}>
                        <td style={cell}>{r.name}{r.supplier && <div style={{ fontSize: '.8rem', color: '#8a9a8f' }}>{r.supplier}</div>}</td>
                        <td style={{ ...cell, color: '#8a9a8f', whiteSpace: 'nowrap' }}>{formatMoney(r.amount, r.currency)} {CYCLE[r.billing_cycle] ?? r.billing_cycle}</td>
                        <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>{formatMoney(monthlyEquivalent(r.amount, r.billing_cycle), r.currency)} / month</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p style={{ fontSize: '.8rem', color: '#8a9a8f' }}>Yearly and quarterly bills are shown as a monthly share. Amounts are not converted between currencies.</p>
        </>
      )}
    </TransparencyShell>
  )
}
