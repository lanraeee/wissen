import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPledge, getBankDetails, accountFor } from '@/lib/bank-transfer'
import BankTransferPanel, { type DetailRow } from '@/components/BankTransferPanel'

export const metadata: Metadata = {
  title: 'Complete Your Bank Transfer · Wissen-Haus',
  description: 'Bank account details for your donation to Wissen-Haus Youth Empowerment Foundation.',
  robots: { index: false, follow: false },
}

// A pledge's status changes as the donor and admin act on it, so this page must
// never be cached.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ reference: string }>
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
}

export default async function BankTransferDetailsPage({ params }: Props) {
  const { reference } = await params
  const pledge = await getPledge(reference)
  if (!pledge) notFound()

  const details = await getBankDetails()
  const account = accountFor(details, pledge.currency)
  const amountLabel = formatAmount(pledge.amount, pledge.currency)

  const rows: DetailRow[] = [
    { label: 'Amount to Transfer', value: amountLabel, emphasis: true },
    { label: 'Account Name', value: details.account_name },
    { label: 'Bank', value: details.bank_name },
  ]

  if (account?.account_number) {
    rows.push({ label: `Account Number (${pledge.currency})`, value: account.account_number, mono: true, emphasis: true })
    if (account.sort_code) rows.push({ label: 'Sort Code', value: account.sort_code, mono: true })
    if (account.iban) rows.push({ label: 'IBAN', value: account.iban, mono: true })
    if (account.swift) rows.push({ label: 'SWIFT / BIC', value: account.swift, mono: true })
  }

  if (details.bank_address) rows.push({ label: 'Bank Address', value: details.bank_address })
  rows.push({ label: 'Payment Reference', value: pledge.reference, mono: true, emphasis: true })

  const missingAccount = !account?.account_number

  return (
    <section className="section" style={{ paddingTop: 'clamp(56px,7vw,96px)', minHeight: '70vh' }}>
      <div className="wrap">
        <div className="section-head center mb-l reveal">
          <span className="eyebrow">Bank Transfer</span>
          <h1 className="display-lg mt-s">
            {pledge.status === 'confirmed' ? 'Your donation is confirmed.' : 'Almost there — one transfer to go.'}
          </h1>
          {pledge.status !== 'confirmed' && (
            <p className="lead">
              Send {amountLabel} to the account below, quoting your reference. We&apos;ve emailed a copy of
              these details to {pledge.email}.
            </p>
          )}
        </div>

        <div
          className="card reveal"
          style={{ padding: 'clamp(22px,4vw,40px)', maxWidth: 620, margin: '0 auto' }}
        >
          {missingAccount ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 .75rem', fontSize: '1.15rem' }}>We couldn&apos;t load the {pledge.currency} account</h2>
              <p style={{ color: 'var(--ink-60)', marginBottom: '1.25rem', fontSize: '.9rem' }}>
                Your donation is saved under reference <strong>{pledge.reference}</strong>. Please email
                {' '}<a href={`mailto:info@wissenhaus.org?subject=Bank transfer ${pledge.reference}`} style={{ color: '#1a3c2e', fontWeight: 600 }}>info@wissenhaus.org</a>
                {' '}and we&apos;ll send you the account details directly.
              </p>
              <Link href="/donate" className="btn btn--ghost">Back to donate</Link>
            </div>
          ) : (
            <BankTransferPanel
              reference={pledge.reference}
              rows={rows}
              amountLabel={amountLabel}
              initialStatus={pledge.status}
              certUrl={pledge.cert_id ? `/donate/receipt/${pledge.cert_id}` : undefined}
              instructions={details.instructions}
              donorEmail={pledge.email}
            />
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.82rem', color: 'var(--ink-60)' }}>
          Questions? Email{' '}
          <a href={`mailto:info@wissenhaus.org?subject=Bank transfer ${pledge.reference}`} style={{ color: 'inherit', fontWeight: 600 }}>
            info@wissenhaus.org
          </a>
          {' '}quoting your reference.
        </p>
      </div>
    </section>
  )
}
