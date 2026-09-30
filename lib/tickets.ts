import { randomBytes } from 'crypto'
import sql from '@/lib/db'
import type { VisitorContext } from '@/lib/visitor-context'

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type AuthorType = 'visitor' | 'staff' | 'ai'

export type Ticket = {
  id: string
  reference: string
  subject: string
  requester_name: string
  requester_email: string | null
  user_id: string | null
  channel: 'form' | 'chat'
  status: TicketStatus
  priority: 'low' | 'normal' | 'high'
  assigned_email: string | null
  ai_handled: boolean
  escalated: boolean
  created_at: string
  last_activity: string
  // Captured once at ticket creation from the request itself.
  device_type: string | null
  browser: string | null
  os: string | null
  user_agent: string | null
  geo_country: string | null
  geo_region: string | null
  geo_city: string | null
  entry_page: string | null
  referrer: string | null
  // Only ever set when the visitor taps "share my location" and accepts the
  // browser's permission prompt. Null is the normal state.
  geo_lat: number | null
  geo_lng: number | null
  geo_accuracy_m: number | null
  geo_shared_at: string | null
}

export type TicketMessage = {
  id: string
  ticket_id: string
  author_type: AuthorType
  author_name: string
  body: string
  audio_id: string | null
  internal: boolean
  created_at: string
}

// The reference is the ONLY thing a signed-out visitor needs to read their
// own thread, so it is a capability token and sized like one: 10 bytes of
// crypto randomness in base32 is ~50 bits, far past guessing at any rate a
// rate-limited endpoint permits. Never shorten this to something "friendlier"
// -- a 6-character code would make every ticket enumerable.
//
// Ambiguous characters (I, L, O, U, 0, 1) are left out so a reference read off
// a screen and typed back in does not bounce.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'

export function generateReference(): string {
  const bytes = randomBytes(10)
  let code = ''
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length]
  return `WH-${code.slice(0, 5)}-${code.slice(5, 10)}`
}

export async function createTicket(input: {
  subject: string
  requesterName: string
  requesterEmail?: string | null
  userId?: string | null
  channel?: 'form' | 'chat'
  body: string
  audioId?: string | null
  context?: VisitorContext | null
}): Promise<Ticket> {
  const reference = generateReference()
  const c = input.context
  const [ticket] = await sql`
    INSERT INTO support_tickets
      (reference, subject, requester_name, requester_email, user_id, channel,
       device_type, browser, os, user_agent, geo_country, geo_region, geo_city,
       entry_page, referrer)
    VALUES
      (${reference}, ${input.subject}, ${input.requesterName},
       ${input.requesterEmail ?? null}, ${input.userId ?? null}, ${input.channel ?? 'form'},
       ${c?.deviceType ?? null}, ${c?.browser ?? null}, ${c?.os ?? null}, ${c?.userAgent ?? null},
       ${c?.geoCountry ?? null}, ${c?.geoRegion ?? null}, ${c?.geoCity ?? null},
       ${c?.entryPage ?? null}, ${c?.referrer ?? null})
    RETURNING *
  ` as Ticket[]

  await addMessage(ticket.id, {
    authorType: 'visitor',
    authorName: input.requesterName,
    body: input.body,
    audioId: input.audioId ?? null,
  })

  return ticket
}

export async function addMessage(ticketId: string, input: {
  authorType: AuthorType
  authorName: string
  body: string
  audioId?: string | null
  internal?: boolean
}): Promise<TicketMessage> {
  const [message] = await sql`
    INSERT INTO ticket_messages (ticket_id, author_type, author_name, body, audio_id, internal)
    VALUES (${ticketId}, ${input.authorType}, ${input.authorName}, ${input.body},
            ${input.audioId ?? null}, ${input.internal ?? false})
    RETURNING *
  ` as TicketMessage[]

  // A visitor writing on a resolved ticket reopens it: otherwise a reply to
  // "is this sorted?" lands in a closed thread nobody is watching.
  await sql`
    UPDATE support_tickets
    SET last_activity = NOW(),
        status = CASE
          WHEN ${input.authorType} = 'visitor' AND status IN ('resolved','closed') THEN 'open'
          WHEN ${input.authorType} = 'staff' AND status = 'open' THEN 'pending'
          ELSE status
        END
    WHERE id = ${ticketId}
  `
  return message
}

export async function getTicketByReference(reference: string): Promise<Ticket | null> {
  const rows = await sql`SELECT * FROM support_tickets WHERE reference = ${reference}` as Ticket[]
  return rows[0] ?? null
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const rows = await sql`SELECT * FROM support_tickets WHERE id = ${id}` as Ticket[]
  return rows[0] ?? null
}

// `includeInternal` is false for every visitor-facing read. Staff notes live
// in the same thread so the conversation stays in one place; the flag is what
// keeps them out of the visitor's view, so callers must opt in explicitly
// rather than filtering at the call site and occasionally forgetting.
export async function getMessages(ticketId: string, opts: { includeInternal?: boolean; since?: string } = {}) {
  const includeInternal = opts.includeInternal ?? false
  if (opts.since) {
    return await sql`
      SELECT * FROM ticket_messages
      WHERE ticket_id = ${ticketId}
        AND created_at > ${opts.since}
        AND (${includeInternal} OR internal = FALSE)
      ORDER BY created_at
    ` as TicketMessage[]
  }
  return await sql`
    SELECT * FROM ticket_messages
    WHERE ticket_id = ${ticketId}
      AND (${includeInternal} OR internal = FALSE)
    ORDER BY created_at
  ` as TicketMessage[]
}
