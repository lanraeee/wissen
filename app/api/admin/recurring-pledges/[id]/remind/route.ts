import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { getRecurringPledgeById, bumpReminder } from '@/lib/recurring-giving'
import { sendRecurringGivingFollowUp } from '@/lib/email'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const BodySchema = z.object({ note: z.string().trim().max(1000).optional() })

// Admin-triggered follow-up to one specific applicant who hasn't completed
// (or has lapsed on) their monthly gift. Distinct from the automated cron
// reminder in app/api/cron/recurring-giving — this one is a deliberate,
// one-off nudge an admin chooses to send, optionally with a personal note.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await adminGuard() || await sectionWriteGuard('giving'))
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await parseBody(req, BodySchema)
  if (error) return error

  const pledge = await getRecurringPledgeById(id)
  if (!pledge) return NextResponse.json({ error: 'Pledge not found' }, { status: 404 })

  const detailsUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'}/give/monthly/${pledge.reference}`

  await sendRecurringGivingFollowUp({
    to: pledge.email, name: pledge.name, amount: pledge.amount, detailsUrl, note: data.note,
  })
  await bumpReminder(pledge.id)
  logActivity(session, 'recurring_pledge.remind', { targetType: 'recurring_pledge', targetId: pledge.reference })

  return NextResponse.json({ success: true })
}
