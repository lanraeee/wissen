import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getRecurringPledge, declareRecurringTransferSent, verifyAndActivateStripeCheckout,
} from '@/lib/recurring-giving'
import { sendRecurringGivingConfirmed, notifyAdminRecurringDeclared } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'

const ReferenceSchema = z.object({ reference: z.string().trim().min(1).max(100) })

// Donor declaring "I've sent this month's transfer" — advisory only, same
// convention as the one-time bank-transfer PUT. Does not itself activate the
// pledge; an admin confirming it landed (app/api/admin/recurring-pledges)
// does that.
export async function PUT(req: NextRequest) {
  const { data, error } = await parseBody(req, ReferenceSchema)
  if (error) return error
  const { reference } = data

  const pledge = await getRecurringPledge(reference)
  if (!pledge) return NextResponse.json({ error: 'No recurring pledge found for that reference' }, { status: 404 })
  if (pledge.method !== 'bank_transfer')
    return NextResponse.json({ error: 'This pledge is not a bank transfer' }, { status: 400 })

  const updated = await declareRecurringTransferSent(reference)

  try {
    await notifyAdminRecurringDeclared({ name: pledge.name, email: pledge.email, amount: pledge.amount, reference })
  } catch (err) {
    log.error('recurring giving declared email', err)
  }

  return NextResponse.json({ status: updated?.status ?? pledge.status })
}

const VerifySchema = z.object({ sessionId: z.string().trim().min(1).max(300) })

// Verifies a completed Stripe subscription Checkout session and activates
// the matching pledge — called by the /give/monthly/[reference] success
// page, same pattern as /api/payments/stripe's PUT for one-time donations.
export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, VerifySchema)
  if (error) return error
  const { sessionId } = data

  try {
    const pledge = await verifyAndActivateStripeCheckout(sessionId)
    if (!pledge) return NextResponse.json({ error: 'Subscription not verified' }, { status: 400 })

    try {
      await sendRecurringGivingConfirmed({ to: pledge.email, name: pledge.name, amount: pledge.amount, nextDueAt: pledge.next_due_at })
    } catch (err) {
      log.error('recurring giving confirmed email', err)
    }

    return NextResponse.json({ success: true, status: pledge.status, nextDueAt: pledge.next_due_at })
  } catch (err) {
    log.error('recurring subscription verify', err)
    const message = err instanceof Error ? err.message : 'Could not verify subscription'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
