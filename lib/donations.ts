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
  provider: 'Stripe'
}

async function alreadyRecorded(reference: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT 1 FROM submissions
      WHERE type = 'donation' AND data->>'reference' = ${reference}
      LIMIT 1
    `
    return rows.length > 0
  } catch {
    return false
  }
}

// Appends a certificate to the donation_certificates JSONB array (a single
// atomic UPDATE, safe under concurrent donations) and returns its cert_id
// so the receipt email can link straight to /donate/receipt/[certId].
async function issueCertificate(d: VerifiedDonation): Promise<string | null> {
  const certId = `WH-DON-${d.reference.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase()}`
  const cert = {
    cert_id: certId,
    donor_name: d.name,
    donor_email: d.email,
    amount: d.amount,
    currency: d.currency,
    date: new Date().toISOString(),
    purpose: 'General Donation',
    issued_at: new Date().toISOString(),
  }

  try {
    await sql`
      INSERT INTO site_content (key, value)
      VALUES ('donation_certificates', jsonb_build_array(${JSON.stringify(cert)}::jsonb))
      ON CONFLICT (key) DO UPDATE
      SET value = site_content.value || jsonb_build_array(${JSON.stringify(cert)}::jsonb),
          updated_at = NOW()
    `
    return certId
  } catch (err) {
    console.error(`[${d.provider} certificate issue]`, err)
    return null
  }
}

// Records a verified donation exactly once (safe to call again if the donor
// reloads the success page — later calls are a no-op) and fires off the
// receipt/notification emails and analytics event.
export async function recordDonation(d: VerifiedDonation): Promise<{ recorded: boolean }> {
  if (await alreadyRecorded(d.reference)) return { recorded: false }

  try {
    await sql`
      INSERT INTO submissions (type, name, email, data)
      VALUES ('donation', ${d.name}, ${d.email}, ${JSON.stringify(d)})
    `
  } catch (err) {
    console.error(`[${d.provider} submission insert]`, err)
  }

  const certId = await issueCertificate(d)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const certUrl = certId ? `${siteUrl}/donate/receipt/${certId}` : undefined

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

  return { recorded: true }
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
