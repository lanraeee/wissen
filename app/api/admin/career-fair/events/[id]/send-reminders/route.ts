import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { sendFairCheckinReminder } from '@/lib/email'
import { log } from '@/lib/logger'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const [event] = await sql`SELECT title, location, event_date, event_time FROM fair_events WHERE id = ${id}`
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const registrants = await sql`
    SELECT name, email, checkin_token FROM fair_registrations
    WHERE event_id = ${id} AND checked_in = false AND email IS NOT NULL
  `
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'

  const results = await Promise.allSettled(
    registrants.map(r => sendFairCheckinReminder({
      to: r.email as string,
      name: r.name as string,
      eventTitle: event.title as string,
      eventDate: event.event_date as string | null,
      eventTime: event.event_time as string | null,
      eventLocation: event.location as string | null,
      guideUrl: `${siteUrl}/career-clarity-trade-fair/checkin/${r.checkin_token}`,
    }))
  )
  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - sent
  if (failed > 0) log.warn('career-fair send-reminders', 'some reminder emails failed', { eventId: id, sent, failed })

  logActivity(session, 'fair_event.send_reminders', {
    targetType: 'fair_event', targetId: id, details: { sent, failed },
  })
  return NextResponse.json({ sent, failed })
}
