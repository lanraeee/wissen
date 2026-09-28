import sql from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { sendDonationReceipt, sendDonationNotification } from '@/lib/email'
import { getPostHogClient } from '@/lib/posthog-server'

export interface VerifiedDonation {
  amount: number
  currency: string
  name: string
  email: string
  reference: string
  provider: 'Stripe' | 'Bank Transfer'
}

function certIdForReference(reference: string): string {
  return `WH-DON-${reference.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase()}`
}

// Records a verified donation exactly once -- INSERT ... ON CONFLICT (reference)
// DO NOTHING makes this atomic, so a retried Stripe webhook racing the
// success-page verification (or the donor simply reloading it) can never
// double-insert or double-email. `donation` is null only on a genuine insert
// failure; on an idempotent no-op retry it's still populated (fetched by
// reference) so callers like the bank-transfer confirm flow can link to it.
export async function recordDonation(d: VerifiedDonation): Promise<{ recorded: boolean; donation: { id: string; cert_id: string } | null }> {
  const certId = certIdForReference(d.reference)

  let row
  try {
    ;[row] = await sql`
      INSERT INTO donations (name, email, amount, currency, reference, provider, cert_id)
      VALUES (${d.name}, ${d.email}, ${d.amount}, ${d.currency}, ${d.reference}, ${d.provider}, ${certId})
      ON CONFLICT (reference) DO NOTHING
      RETURNING id, cert_id
    `
  } catch (err) {
    console.error(`[${d.provider} donation insert]`, err)
    return { recorded: false, donation: null }
  }

  if (!row) {
    const [existing] = await sql`SELECT id, cert_id FROM donations WHERE reference = ${d.reference}`
    return { recorded: false, donation: existing ? { id: existing.id as string, cert_id: existing.cert_id as string } : null }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const certUrl = `${siteUrl}/donate/receipt/${certId}`

  try {
    await Promise.all([
      sendDonationReceipt(d.email, d.name, d.amount, d.currency, d.reference, certUrl),
      sendDonationNotification({ name: d.name, email: d.email, amount: d.amount, currency: d.currency, ref: d.reference, provider: d.provider }),
    ])
  } catch (err) {
    console.error(`[${d.provider} email]`, err)
  }

  try {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: d.reference,
      event: 'donation_completed',
      properties: { amount: d.amount, currency: d.currency, provider: d.provider.toLowerCase(), reference: d.reference },
    })
    await posthog.flush()
  } catch (err) {
    console.error('[donation posthog]', err)
  }

  return { recorded: true, donation: { id: row.id as string, cert_id: row.cert_id as string } }
}

export async function verifyStripeSession(sessionId: string): Promise<VerifiedDonation | null> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') return null

  const amount = (session.amount_total ?? 0) / 100
  const currency = (session.currency ?? 'usd').toUpperCase()
  const email = session.customer_details?.email || session.customer_email || 'unknown@wissenhaus.org'
  const name = session.metadata?.name || email

  return { amount, currency, name, email, reference: session.id, provider: 'Stripe' }
}
