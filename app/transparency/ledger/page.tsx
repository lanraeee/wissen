import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { listPublicLedger } from '@/lib/ledger'
import { LEDGER_LIMIT, SOURCE_LABELS, formatMoney, totalsByCurrency, type LedgerRow, type LedgerSource } from '@/lib/ledger-shared'
import { log } from '@/lib/logger'
import TransparencyShell from '@/components/TransparencyShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = pageMetadata({
  title: 'Financial Ledger · Wissen-Haus',
  ogTitle: 'Wissen-Haus Financial Ledger',
  description: `The last ${LEDGER_LIMIT} transactions across the Wissen-Haus Empowerment Foundation's accounts: what came in and what went out.`,
})

const cell = { padding: '10px 8px', borderBottom: '1px solid #e8e4dc', verticalAlign: 'top' as const }
// occurred_on is a Postgres DATE column, and the Neon driver returns those as
// a native JS Date (not a string) -- String(v).slice(0, 10) on a Date gives
// its default toString() prefix ("Mon Jan 15 2026" style, from
// Date.prototype.toString(), not an ISO string), which then fails to parse
// and renders "Invalid Date". Same v instanceof Date check as
// lib/ledger.ts's normaliseForCompare(), which hit the same issue.
const fmtDate = (v: string | Date) => {
  const iso = v instanceof Date ? v.toISOString() : String(v)
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
const humanise = (v: string) => v.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())

export default async function LedgerPage() {
  let rows: LedgerRow[] = []
  let failed = false
  try {
    rows = (await listPublicLedger()) as unknown as LedgerRow[]
  } catch (err) {
    log.error('transparency ledger', err)
    failed = true
  }
  const totals = totalsByCurrency(rows)

  return (
    <TransparencyShell
      active="ledger"
      title="Financial Ledger"
      intro={<>
        Every pound and naira that comes in or goes out of the foundation&apos;s accounts, so you can see where money is going.
        This shows the last {LEDGER_LIMIT} transactions from Stripe, Zeffy, and our UK and Nigerian bank accounts.
        Donations made via Zeffy carry zero platform fees — 100% of those gifts reach Wissen-Haus, with
        donors given the option to tip Zeffy separately instead. Donors are never named. Our month-to-month running costs are on the{' '}
        <Link href="/transparency/costs" style={{ color: '#1a3c2e' }}>operational fixed costs</Link> page.
      </>}
    >
      {failed ? (
        <p style={{ color: '#8a9a8f' }}>The ledger is not available right now. Please try again later.</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#8a9a8f' }}>No transactions have been published yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
            {totals.map(t => (
              <div key={t.currency} style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#8a9a8f', marginBottom: 8 }}>{t.currency}</div>
                <div style={{ color: '#166534' }}>In: <strong>{formatMoney(t.moneyIn, t.currency)}</strong></div>
                <div style={{ color: '#991b1b' }}>Out: <strong>{formatMoney(t.moneyOut, t.currency)}</strong></div>
                <div style={{ marginTop: 6, fontWeight: 700, color: '#0f2d1d' }}>Net: {formatMoney(t.net, t.currency)}</div>
              </div>
            ))}
          </div>
          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e8e4dc', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem', minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#f5f3f0', textAlign: 'left' }}>
                  <th style={cell}>Date</th><th style={cell}>Description</th><th style={cell}>Category</th><th style={cell}>Account</th>
                  <th style={{ ...cell, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>{fmtDate(r.occurred_on)}</td>
                    <td style={cell}>{r.description}{r.is_transfer && <span style={{ color: '#8a9a8f', fontSize: '.8rem' }}> (between our own accounts)</span>}</td>
                    <td style={cell}>{r.category ? humanise(r.category) : '—'}</td>
                    <td style={cell}>{SOURCE_LABELS[r.source as LedgerSource] ?? r.source}</td>
                    <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600, color: r.direction === 'in' ? '#166534' : '#991b1b' }}>
                      {r.direction === 'in' ? '+' : '−'}{formatMoney(r.amount, r.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '.8rem', color: '#8a9a8f', marginTop: 14 }}>
            Totals cover the transactions listed above and leave out transfers between the foundation&apos;s own accounts, which
            would otherwise be counted twice. Amounts are shown in the currency they were paid in and are not converted.
          </p>
        </>
      )}
    </TransparencyShell>
  )
}
