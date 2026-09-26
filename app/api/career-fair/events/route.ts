import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import type { FairEvent } from '@/lib/career-fair'

// Public: only published events, and only the fields a registrant needs to
// pick an event and see its booths -- no need to filter further since
// nothing sensitive lives on fair_events.
export async function GET() {
  const rows = await sql`
    SELECT id, slug, title, school, location, event_date, event_time, status, description, booths, created_at, updated_at
    FROM fair_events
    WHERE status = 'published'
    ORDER BY event_date ASC NULLS LAST
  `
  return NextResponse.json({ events: rows as unknown as FairEvent[] })
}
