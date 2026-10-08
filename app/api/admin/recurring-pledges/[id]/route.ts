import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import {
  getRecurringPledgeById, confirmRecurringTransferReceived, setRecurringStatus,
} from '@/lib/recurring-giving'
import { sendRecurringGivingConfirmed } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { logActivity } from '@/lib/audit-log'

const ActionSchema = z.object({ action: z.enum(['confirm', 'lapse', 'cancel']) })

// Admin acting on one pledge: 'confirm' is the bank-transfer-only action
// ("this cycle's money landed") — mirrors /api/admin/bank-transfers' confirm
// action, but rolls the pledge forward to next month instead of closing it
// out. 'lapse'/'cancel' work for either payment method (a Stripe
// subscription is cancelled on Stripe's side separately; this only updates
// our own record of it).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await adminGuard() || await sectionWriteGuard('giving'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await parseBody(req, ActionSchema)
  if (error) return error

  const pledge = await getRecurringPledgeById(id)
  if (!pledge) return NextResponse.json({ error: 'Pledge not found' }, { status: 404 })

  if (data.action === 'confirm') {
    if (pledge.method !== 'bank_transfer')
      return NextResponse.json({ error: 'Only bank-transfer pledges are confirmed this way' }, { status: 400 })
    const updated = await confirmRecurringTransferReceived(pledge.reference)
    try {
      await sendRecurringGivingConfirmed({ to: pledge.email, name: pledge.name, amount: pledge.amount, nextDueAt: updated?.next_due_at ?? null })
    } catch (err) {
      log.error('recurring giving confirmed email (admin)', err)
    }
    logActivity(session, 'recurring_pledge.confirm', { targetType: 'recurring_pledge', targetId: pledge.reference })
    return NextResponse.json({ success: true, pledge: updated })
  }

  const status = data.action === 'lapse' ? 'lapsed' : 'cancelled'
  const updated = await setRecurringStatus(id, status)
  logActivity(session, `recurring_pledge.${data.action}`, { targetType: 'recurring_pledge', targetId: pledge.reference })
  return NextResponse.json({ success: true, pledge: updated })
}
