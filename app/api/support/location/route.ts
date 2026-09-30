import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { getTicketByReference } from '@/lib/tickets'
import { addMessage } from '@/lib/tickets'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Precise location, written ONLY after the visitor taps "share my location"
// and accepts the browser's own permission prompt. There is no covert route to
// this data -- the Geolocation API cannot be read without that prompt, and an
// IP cannot be resolved below city level -- so this endpoint exists to record
// a deliberate act, not to harvest one.
//
// Consent is recorded as a visible message in the thread as well as a
// timestamp on the ticket: the visitor can see in their own transcript exactly
// what they shared and when, which is what makes it defensible under NDPA and
// UK GDPR and what a retention sweep would key on.
const LocationSchema = z.object({
  reference: z.string().max(40),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100_000).nullish(),
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, LocationSchema)
  if (error) return error

  try {
    const ticket = await getTicketByReference(data.reference)
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'This conversation is closed.' }, { status: 409 })
    }

    await sql`
      UPDATE support_tickets
      SET geo_lat = ${data.lat},
          geo_lng = ${data.lng},
          geo_accuracy_m = ${data.accuracy ? Math.round(data.accuracy) : null},
          geo_shared_at = NOW()
      WHERE id = ${ticket.id}
    `

    await addMessage(ticket.id, {
      authorType: 'visitor',
      authorName: ticket.requester_name,
      body: '📍 Shared my location with the support team.',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('support location', err)
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 })
  }
}
