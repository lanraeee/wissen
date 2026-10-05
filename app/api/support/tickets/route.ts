import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { parseBody, zEmail, zName, zShortText, zLongText } from '@/lib/validation'
import { createTicket } from '@/lib/tickets'
import { visitorContextFrom } from '@/lib/visitor-context'
import { mintAccessToken, TICKET_TOKEN_COOKIE } from '@/lib/ticket-access'
import { sendTicketOpened, notifyStaffNewTicket } from '@/lib/email'
import { log } from '@/lib/logger'
import { recordConcern, looksLikeSafeguarding } from '@/lib/safeguarding'

const CreateSchema = z.object({
  name: zName,
  email: zEmail,
  subject: zShortText,
  message: zLongText,
  channel: z.enum(['form', 'chat']).nullish(),
  page: z.string().max(500).nullish(),
  referrer: z.string().max(1000).nullish(),
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, CreateSchema)
  if (error) return error

  const session = await getSession()

  try {
    const ticket = await createTicket({
      subject: data.subject,
      requesterName: data.name,
      // A signed-in visitor's own address beats whatever the form carried:
      // it is the one we know is theirs.
      requesterEmail: session?.email ?? data.email ?? null,
      userId: session?.id ?? null,
      channel: data.channel ?? 'form',
      body: data.message,
      context: visitorContextFrom(req, { page: data.page, referrer: data.referrer }),
    })

    // A ticket that reads like a safeguarding concern is also copied into the
    // restricted incident log, so it reaches the safeguarding team and not
    // only the general support queue.
    if (looksLikeSafeguarding(data.subject, data.message)) {
      try {
        await recordConcern({
          source: 'support_ticket', sourceRef: ticket.reference,
          reporterName: data.name, reporterEmail: ticket.requester_email,
          description: `${data.subject}\n\n${data.message}`,
        })
      } catch (err) {
        log.error('support ticket safeguarding', err)
      }
    }

    // Email is best-effort. A ticket that exists but whose notification failed
    // is recoverable from the admin queue; losing the ticket because Resend
    // was down is not.
    try {
      await Promise.all([
        ticket.requester_email ? sendTicketOpened(ticket) : Promise.resolve(),
        notifyStaffNewTicket(ticket, data.message),
      ])
    } catch (err) {
      log.error('support ticket email', err)
    }

    // Issue the access token to the browser that opened the ticket, so the
    // person who just typed the message is not immediately asked to prove
    // who they are. Everyone else needs a magic link.
    const res = NextResponse.json({ success: true, reference: ticket.reference, id: ticket.id })
    res.cookies.set(TICKET_TOKEN_COOKIE, await mintAccessToken(ticket.id, ticket.reference), {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: 90 * 24 * 60 * 60,
    })
    return res
  } catch (err) {
    log.error('support ticket create', err)
    return NextResponse.json({ error: 'Could not open a ticket right now' }, { status: 500 })
  }
}
