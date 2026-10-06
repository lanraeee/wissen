import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getRecurringPledge, verifyAndActivateStripeCheckout } from '@/lib/recurring-giving'
import { getBankDetails, accountFor } from '@/lib/bank-transfer'
import { getContactDetails } from '@/lib/contact-details'
import RecurringGivingPanel, { type DetailRow } from '@/components/RecurringGivingPanel'
import { sendRecurringGivingConfirmed } from '@/lib/email'
import { log } from '@/lib/logger'

export const metadata: Metadata = { robots: { index: false, follow: false } }

// A pledge's status changes as the donor and admin act on it.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ session_id?: string }>
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
}

export default async function RecurringGivingPage({ params, searchParams }: Props) {
  const { reference } = await params
  const { session_id } = await searchParams

  let pledge = await getRecurringPledge(reference)
  if (!pledge) notFound()

  // Stripe redirected back from a completed subscription Checkout — verify
  // and activate before rendering, so the page shows the final state on
  // first paint rather than a flash of "pending".
  if (pledge.method === 'stripe' && session_id && pledge.status === 'pending') {
    try {
      const activated = await verifyAndActivateStripeCheckout(session_id)
      if (activated) {
        pledge = activated
        try {
          await sendRecurringGivingConfirmed({ to: pledge.email, name: pledge.name, amount: pledge.amount, nextDueAt: pledge.next_due_at })
        } catch (err) {
          log.error('recurring giving confirmed email', err)
        }
      }
    } catch (err) {
      log.error('recurring subscription verify (page)', err)
    }
  }

  const contactDetails = await getContactDetails()
  const amountLabel = formatAmount(pledge.amount)

  if (pledge.method === 'stripe') {
    // Stripe handles the actual recurring charge; this page only ever shows
    // the resulting state (active after Checkout, or a cancelled-out-of-
    // Checkout pending state with no bank details to show).
    return (
      <section className="section" style={{ paddingTop: 'clamp(56px,7vw,96px)', minHeight: '70vh' }}>
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Monthly Gift</span>
            <h1 className="display-lg mt-s">
              {pledge.status === 'active' ? 'Your monthly gift is active.' : 'Your monthly gift isn\'t set up yet.'}
            </h1>
          </div>
          <div className="card reveal" style={{ padding: 'clamp(22px,4vw,40px)', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            {pledge.status === 'active' ? (
              <p style={{ color: 'var(--ink-60)' }}>
                Thank you — your card is set up for <strong>{amountLabel}/month</strong>.
              </p>
            ) : (
              <>
                <p style={{ color: 'var(--ink-60)', marginBottom: '1.25rem' }}>
                  It looks like checkout wasn&apos;t completed. Your application has already been received — email us and we&apos;ll help you finish setting up your {amountLabel}/month gift.
                </p>
                <a href={`mailto:${contactDetails.primary_email}?subject=Monthly gift ${reference}`} className="btn">
                  Email {contactDetails.primary_email}
                </a>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Bank transfer: show the same account details as a one-time pledge, plus
  // the recurring-specific "declare this month's transfer" action.
  const bankDetails = await getBankDetails()
  const account = accountFor(bankDetails, 'NGN')
  const missingAccount = !account?.account_number

  const rows: DetailRow[] = [
    { label: 'Monthly Amount', value: amountLabel, emphasis: true },
  ]
  if (!missingAccount && account) {
    rows.push({ label: 'Account Name', value: bankDetails.account_name })
    rows.push({ label: 'Bank', value: bankDetails.bank_name })
    rows.push({ label: 'Account Number', value: account.account_number!, mono: true, emphasis: true })
    if (account.sort_code) rows.push({ label: 'Sort Code', value: account.sort_code, mono: true })
  }
  rows.push({ label: 'Payment Reference', value: pledge.reference, mono: true, emphasis: true })

  return (
    <section className="section" style={{ paddingTop: 'clamp(56px,7vw,96px)', minHeight: '70vh' }}>
      <div className="wrap">
        <div className="section-head center mb-l reveal">
          <span className="eyebrow">Monthly Gift</span>
          <h1 className="display-lg mt-s">
            {pledge.status === 'active' ? 'Your monthly gift is active.' : 'Set up your monthly transfer'}
          </h1>
          {pledge.status !== 'active' && (
            <p className="lead">
              Send {amountLabel} to the account below each month, quoting your reference, then declare it below.
            </p>
          )}
        </div>

        <div className="card reveal" style={{ padding: 'clamp(22px,4vw,40px)', maxWidth: 620, margin: '0 auto' }}>
          {missingAccount ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 .75rem', fontSize: '1.15rem' }}>We couldn&apos;t load the account details</h2>
              <p style={{ color: 'var(--ink-60)', marginBottom: '1.25rem', fontSize: '.9rem' }}>
                Your pledge is saved under reference <strong>{pledge.reference}</strong>. Please email
                {' '}<a href={`mailto:${contactDetails.primary_email}?subject=Monthly gift ${pledge.reference}`} style={{ color: '#1a3c2e', fontWeight: 600 }}>{contactDetails.primary_email}</a>
                {' '}and we&apos;ll send you the account details directly.
              </p>
            </div>
          ) : (
            <RecurringGivingPanel
              reference={pledge.reference}
              rows={rows}
              amountLabel={amountLabel}
              initialStatus={pledge.status}
              nextDueAt={pledge.next_due_at}
              supportEmail={contactDetails.primary_email}
            />
          )}
        </div>
      </div>
    </section>
  )
}
