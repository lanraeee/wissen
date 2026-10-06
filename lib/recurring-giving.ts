import sql from '@/lib/db'
import { getStripe } from '@/lib/stripe'

export type RecurringSourceType = 'volunteer' | 'partner'
export type RecurringMethod = 'stripe' | 'bank_transfer'
export type RecurringStatus = 'pending' | 'declared' | 'active' | 'lapsed' | 'cancelled'

export interface RecurringPledge {
  id: string
  source_type: RecurringSourceType
  source_id: string
  name: string
  email: string
  amount: number
  currency: string
  method: RecurringMethod
  status: RecurringStatus
  reference: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  declared_at: string | null
  last_payment_at: string | null
  next_due_at: string | null
  reminder_count: number
  last_reminder_at: string | null
  created_at: string
}

// The amount floor applies to NGN only -- recurring giving tied to volunteer
// and partner registration is NGN-only for now (the one-time /donate flow is
// where multi-currency giving lives).
export const MIN_MONTHLY_NGN = 5000

// Same base32-reference scheme as lib/bank-transfer.ts's generateReference(),
// just with its own prefix so a recurring pledge's reference is never
// confused with a one-time bank-transfer pledge's.
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateRecurringReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let value = 0
  let bits = 0
  let out = ''

  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  return `WH-RG-${out}`
}

function mapRow(row: Record<string, unknown>): RecurringPledge {
  return {
    id: row.id as string,
    source_type: row.source_type as RecurringSourceType,
    source_id: row.source_id as string,
    name: row.name as string,
    email: row.email as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    method: row.method as RecurringMethod,
    status: row.status as RecurringStatus,
    reference: row.reference as string,
    stripe_subscription_id: (row.stripe_subscription_id as string | null) ?? null,
    stripe_customer_id: (row.stripe_customer_id as string | null) ?? null,
    declared_at: (row.declared_at as string | null) ?? null,
    last_payment_at: (row.last_payment_at as string | null) ?? null,
    next_due_at: (row.next_due_at as string | null) ?? null,
    reminder_count: Number(row.reminder_count ?? 0),
    last_reminder_at: (row.last_reminder_at as string | null) ?? null,
    created_at: row.created_at as string,
  }
}

export async function createRecurringPledge(input: {
  sourceType: RecurringSourceType
  sourceId: string
  name: string
  email: string
  amount: number
  method: RecurringMethod
}): Promise<RecurringPledge> {
  const reference = generateRecurringReference()
  const [row] = await sql`
    INSERT INTO recurring_pledges (source_type, source_id, name, email, amount, currency, method, reference)
    VALUES (${input.sourceType}, ${input.sourceId}, ${input.name}, ${input.email}, ${input.amount}, 'NGN', ${input.method}, ${reference})
    RETURNING *
  `
  return mapRow(row)
}

export async function getRecurringPledge(reference: string): Promise<RecurringPledge | null> {
  const [row] = await sql`SELECT * FROM recurring_pledges WHERE reference = ${reference}`
  return row ? mapRow(row) : null
}

export async function getRecurringPledgeById(id: string): Promise<RecurringPledge | null> {
  const [row] = await sql`SELECT * FROM recurring_pledges WHERE id = ${id}`
  return row ? mapRow(row) : null
}

export async function listRecurringPledges(filter?: { status?: RecurringStatus }): Promise<RecurringPledge[]> {
  const rows = filter?.status
    ? await sql`SELECT * FROM recurring_pledges WHERE status = ${filter.status} ORDER BY created_at DESC`
    : await sql`SELECT * FROM recurring_pledges ORDER BY created_at DESC`
  return rows.map(mapRow)
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

// Donor declares this cycle's bank transfer sent. Advisory only, same as a
// one-time pledge's declared_sent -- it nudges admin to go look for the
// money, it does not itself activate anything.
export async function declareRecurringTransferSent(reference: string): Promise<RecurringPledge | null> {
  const [row] = await sql`
    UPDATE recurring_pledges
    SET status = 'declared', declared_at = NOW()
    WHERE reference = ${reference} AND status IN ('pending', 'declared', 'lapsed')
    RETURNING *
  `
  return row ? mapRow(row) : null
}

// Admin confirms a bank-transfer cycle's money actually landed -- the same
// moment a one-time pledge becomes a donation. Rolls the pledge forward to
// next month rather than closing it out, since the commitment itself
// continues.
export async function confirmRecurringTransferReceived(reference: string): Promise<RecurringPledge | null> {
  const now = new Date()
  const [row] = await sql`
    UPDATE recurring_pledges
    SET status = 'active', last_payment_at = NOW(), next_due_at = ${addMonths(now, 1)}, reminder_count = 0
    WHERE reference = ${reference}
    RETURNING *
  `
  return row ? mapRow(row) : null
}

// Called from the /give/monthly/[reference] success page (and the Stripe
// webhook, as a belt-and-suspenders path) once Checkout redirects back.
// Mirrors lib/donations.ts's verifyStripeSession, but for a subscription
// session rather than a one-time payment: there's no payment_status to
// check, 'complete' on the session itself is what confirms the subscription
// was actually created.
export async function verifyAndActivateStripeCheckout(sessionId: string): Promise<RecurringPledge | null> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  if (session.status !== 'complete' || session.mode !== 'subscription') return null
  const reference = session.metadata?.recurring_pledge_reference
  if (!reference) return null

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!subscriptionId || !customerId) return null

  return activateStripeSubscription(reference, { subscriptionId, customerId })
}

export async function activateStripeSubscription(reference: string, opts: {
  subscriptionId: string
  customerId: string
}): Promise<RecurringPledge | null> {
  const now = new Date()
  const [row] = await sql`
    UPDATE recurring_pledges
    SET status = 'active', stripe_subscription_id = ${opts.subscriptionId}, stripe_customer_id = ${opts.customerId},
        last_payment_at = NOW(), next_due_at = ${addMonths(now, 1)}, reminder_count = 0
    WHERE reference = ${reference}
    RETURNING *
  `
  return row ? mapRow(row) : null
}

export async function recordStripeRenewal(subscriptionId: string): Promise<RecurringPledge | null> {
  const now = new Date()
  const [row] = await sql`
    UPDATE recurring_pledges
    SET status = 'active', last_payment_at = NOW(), next_due_at = ${addMonths(now, 1)}, reminder_count = 0
    WHERE stripe_subscription_id = ${subscriptionId}
    RETURNING *
  `
  return row ? mapRow(row) : null
}

export async function markStripeLapsed(subscriptionId: string): Promise<RecurringPledge | null> {
  const [row] = await sql`
    UPDATE recurring_pledges SET status = 'lapsed'
    WHERE stripe_subscription_id = ${subscriptionId}
    RETURNING *
  `
  return row ? mapRow(row) : null
}

export async function markStripeCancelled(subscriptionId: string): Promise<RecurringPledge | null> {
  const [row] = await sql`
    UPDATE recurring_pledges SET status = 'cancelled'
    WHERE stripe_subscription_id = ${subscriptionId}
    RETURNING *
  `
  return row ? mapRow(row) : null
}

export async function setRecurringStatus(id: string, status: RecurringStatus): Promise<RecurringPledge | null> {
  const [row] = await sql`
    UPDATE recurring_pledges SET status = ${status} WHERE id = ${id} RETURNING *
  `
  return row ? mapRow(row) : null
}

export async function bumpReminder(id: string): Promise<void> {
  await sql`
    UPDATE recurring_pledges
    SET reminder_count = reminder_count + 1, last_reminder_at = NOW()
    WHERE id = ${id}
  `
}

// Pledges a cron should nudge: never-completed setup (pending/declared, no
// reminder in the last 7 days) and active bank-transfer pledges whose next
// cycle is due. Stripe pledges don't need a due-date nudge -- Stripe retries
// the charge itself and the webhook keeps status current.
export async function listPledgesNeedingReminder(): Promise<RecurringPledge[]> {
  const rows = await sql`
    SELECT * FROM recurring_pledges
    WHERE status IN ('pending', 'declared')
      AND (last_reminder_at IS NULL OR last_reminder_at < NOW() - INTERVAL '7 days')
    UNION ALL
    SELECT * FROM recurring_pledges
    WHERE method = 'bank_transfer' AND status = 'active'
      AND next_due_at IS NOT NULL AND next_due_at <= NOW()
      AND (last_reminder_at IS NULL OR last_reminder_at < NOW() - INTERVAL '7 days')
  `
  return rows.map(mapRow)
}

// Bank-transfer pledges overdue long enough (30 days past due) that they're
// treated as lapsed rather than just "due" -- stops them from being nudged
// forever on the 7-day cadence above.
export async function lapseOverdueBankTransfers(): Promise<number> {
  const rows = await sql`
    UPDATE recurring_pledges
    SET status = 'lapsed'
    WHERE method = 'bank_transfer' AND status = 'active'
      AND next_due_at IS NOT NULL AND next_due_at <= NOW() - INTERVAL '30 days'
    RETURNING id
  `
  return rows.length
}

export async function getLatestPledgeForSource(sourceType: RecurringSourceType, sourceId: string): Promise<RecurringPledge | null> {
  const [row] = await sql`
    SELECT * FROM recurring_pledges
    WHERE source_type = ${sourceType} AND source_id = ${sourceId}
    ORDER BY created_at DESC LIMIT 1
  `
  return row ? mapRow(row) : null
}

// Status for every volunteer/partner application that has (or hasn't) set up
// giving -- keyed by source_id so admin list pages can look theirs up with
// one map instead of one query per row.
// Called from the volunteer/partner API routes right after the application
// itself is inserted. Creates the pledge row and, for the card rail, a
// Stripe subscription Checkout session -- returning wherever the applicant
// should be sent next so both routes stay thin.
export async function startRecurringPledge(input: {
  sourceType: RecurringSourceType
  sourceId: string
  name: string
  email: string
  amount: number
  method: RecurringMethod
}): Promise<{ reference: string; redirectUrl: string }> {
  const pledge = await createRecurringPledge(input)

  if (input.method === 'bank_transfer') {
    return { reference: pledge.reference, redirectUrl: `/give/monthly/${pledge.reference}` }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // Payments not configured -- leave the pledge 'pending' and send the
    // applicant to the same details page bank transfer uses, which shows a
    // "not available" state rather than a broken Stripe redirect.
    return { reference: pledge.reference, redirectUrl: `/give/monthly/${pledge.reference}` }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: input.email,
    line_items: [{
      price_data: {
        currency: 'ngn',
        product_data: { name: 'Monthly gift to Wissen-Haus Empowerment Foundation' },
        unit_amount: Math.round(input.amount * 100),
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    metadata: { recurring_pledge_reference: pledge.reference },
    subscription_data: { metadata: { recurring_pledge_reference: pledge.reference } },
    success_url: `${siteUrl}/give/monthly/${pledge.reference}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/give/monthly/${pledge.reference}`,
  })

  return { reference: pledge.reference, redirectUrl: session.url ?? `/give/monthly/${pledge.reference}` }
}

export async function getPledgeStatusMap(sourceType: RecurringSourceType): Promise<Map<string, RecurringStatus>> {
  const rows = await sql`
    SELECT DISTINCT ON (source_id) source_id, status
    FROM recurring_pledges
    WHERE source_type = ${sourceType}
    ORDER BY source_id, created_at DESC
  `
  return new Map(rows.map(r => [r.source_id as string, r.status as RecurringStatus]))
}
