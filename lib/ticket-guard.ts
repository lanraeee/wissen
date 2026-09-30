import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { getTicketByReference, type Ticket } from '@/lib/tickets'
import { ticketFromToken, TICKET_TOKEN_COOKIE } from '@/lib/ticket-access'

export type TicketAccess =
  | { ok: true; ticket: Ticket }
  | { ok: false; reason: 'not_found' | 'denied' }

// The single place that decides whether a caller may see a conversation.
// Every visitor-facing read and write goes through this -- the API routes and
// the page both -- so there is one answer to "who can read this thread"
// rather than one per entry point.
//
// `not_found` and `denied` are deliberately reported the same way to callers
// (see the routes): telling an unauthenticated stranger that a reference
// exists but is not theirs confirms the reference is real, which is exactly
// what someone guessing references wants to learn.
export async function ticketAccess(reference: string, urlToken?: string): Promise<TicketAccess> {
  const ticket = await getTicketByReference(reference)
  if (!ticket) return { ok: false, reason: 'not_found' }

  // 1. The account that owns it.
  const session = await getSession()
  if (session && ticket.user_id && session.id === ticket.user_id) return { ok: true, ticket }

  // 2. An access token -- from the cookie set when the ticket was opened, or
  //    passed in the URL by a magic link that has just been redeemed.
  const cookieToken = (await cookies()).get(TICKET_TOKEN_COOKIE)?.value
  for (const token of [cookieToken, urlToken]) {
    if (await ticketFromToken(token, reference, 'access') === ticket.id) {
      return { ok: true, ticket }
    }
  }

  return { ok: false, reason: 'denied' }
}

// Case- and whitespace-insensitive, because an address typed from memory will
// not match the stored one byte for byte and bouncing a legitimate visitor on
// capitalisation helps nobody.
export function emailMatches(ticket: Ticket, candidate: string): boolean {
  if (!ticket.requester_email) return false
  return ticket.requester_email.trim().toLowerCase() === candidate.trim().toLowerCase()
}
