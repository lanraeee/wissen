import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { recommendBooths, type Booth, type AssessmentSnapshot } from '@/lib/career-fair'

// Public, token-gated (not a login) -- this is the link emailed to a
// registrant so they can view their personal booth guide. It is
// deliberately read-only: checking someone in is an admin action (see
// docs/adr on the admin activity route for the same reasoning against a
// self-reported/self-serve source of truth for headcounts).
export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [row] = await sql`
    SELECT r.name, r.career_interest, r.assessment_snapshot, r.checked_in, r.checked_in_at,
           e.title AS event_title, e.school AS event_school, e.location, e.event_date, e.event_time, e.booths
    FROM fair_registrations r
    JOIN fair_events e ON e.id = r.event_id
    WHERE r.checkin_token = ${token}
  `
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const booths = recommendBooths(
    row.booths as Booth[],
    row.career_interest as string | null,
    row.assessment_snapshot as AssessmentSnapshot[] | null
  )

  return NextResponse.json({
    name: row.name,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    event: {
      title: row.event_title, school: row.event_school, location: row.location,
      date: row.event_date, time: row.event_time,
    },
    recommendedBooths: booths,
    allBooths: row.booths,
  })
}
