import { NextRequest, NextResponse } from 'next/server'
import {
  listPledgesNeedingReminder, lapseOverdueBankTransfers, bumpReminder,
} from '@/lib/recurring-giving'
import { sendRecurringGivingSetupReminder, sendRecurringGivingDueReminder } from '@/lib/email'
import { log } from '@/lib/logger'

// maxDuration is read only by Vercel; `next start` on App Service ignores it.
// The limit that applies on Azure is the front end's fixed 230s request
// timeout, so declare that rather than a number nothing enforces. Same
// convention as /api/cron/opportunities.
export const maxDuration = 230

// Nudges two groups once a day:
//   - pending/declared pledges nobody has finished setting up, on a 7-day
//     cadence (listPledgesNeedingReminder enforces the cadence itself)
//   - active bank-transfer pledges whose next cycle is due
// then lapses any bank-transfer pledge that's gone 30+ days past due
// without a new declare+confirm cycle.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  let reminded = 0

  try {
    const pledges = await listPledgesNeedingReminder()
    for (const pledge of pledges) {
      const detailsUrl = `${siteUrl}/give/monthly/${pledge.reference}`
      try {
        if (pledge.status === 'active') {
          await sendRecurringGivingDueReminder({ to: pledge.email, name: pledge.name, amount: pledge.amount, detailsUrl })
        } else {
          await sendRecurringGivingSetupReminder({ to: pledge.email, name: pledge.name, amount: pledge.amount, detailsUrl })
        }
        await bumpReminder(pledge.id)
        reminded++
      } catch (err) {
        log.error('recurring giving cron reminder', err, { pledgeId: pledge.id })
      }
    }
  } catch (err) {
    log.error('recurring giving cron (list)', err)
    return NextResponse.json({ error: 'Could not list pledges' }, { status: 500 })
  }

  let lapsed = 0
  try {
    lapsed = await lapseOverdueBankTransfers()
  } catch (err) {
    log.error('recurring giving cron (lapse)', err)
  }

  return NextResponse.json({ reminded, lapsed })
}
