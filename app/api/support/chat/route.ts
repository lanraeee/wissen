import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { parseBody, zLongText } from '@/lib/validation'
import { createTicket, getTicketByReference, getMessages, addMessage } from '@/lib/tickets'
import { ticketAccess } from '@/lib/ticket-guard'
import { answerSupportQuestion, isAgentConfigured } from '@/lib/support-agent'
import { visitorContextFrom } from '@/lib/visitor-context'
import { mintAccessToken, TICKET_TOKEN_COOKIE } from '@/lib/ticket-access'
import { notifyStaffNewTicket, notifyStaffReply } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ChatSchema = z.object({
  reference: z.string().max(40).nullish(),
  message: zLongText,
  name: z.string().max(120).nullish(),
  email: z.string().email().max(200).nullish(),
  // Where the visitor opened the chat from, so staff can see what they were
  // reading. Everything else in the context comes from request headers.
  page: z.string().max(500).nullish(),
  referrer: z.string().max(1000).nullish(),
})

// One turn of the live chat. The chat is not a separate store: every turn is a
// message on a support ticket, so a conversation the AI could not finish is
// already sitting in the admin queue as a ticket rather than needing to be
// copied into one.
export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ChatSchema)
  if (error) return error

  const session = await getSession()
  const visitorName = session?.name || data.name || 'Visitor'
  const visitorEmail = session?.email ?? data.email ?? null

  try {
    let ticket = data.reference ? await getTicketByReference(data.reference) : null
    let opened = false

    if (!ticket) {
      // The conversation is locked to this address from here on, so there is
      // no point starting one without it.
      if (!visitorEmail) {
        return NextResponse.json({ error: 'An email address is required to start a chat.' }, { status: 400 })
      }
      ticket = await createTicket({
        subject: data.message.slice(0, 80),
        requesterName: visitorName,
        requesterEmail: visitorEmail,
        userId: session?.id ?? null,
        channel: 'chat',
        body: data.message,
        context: visitorContextFrom(req, { page: data.page, referrer: data.referrer }),
      })
      opened = true
    } else {
      // Quoting a reference is not proof of anything. Same check the read
      // route uses, so a stranger cannot append to someone else's thread.
      const access = await ticketAccess(ticket.reference)
      if (!access.ok) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (ticket.status === 'closed') {
        return NextResponse.json({ error: 'This conversation is closed.' }, { status: 409 })
      }
      await addMessage(ticket.id, {
        authorType: 'visitor',
        authorName: visitorName,
        body: data.message,
      })
    }

    // Once a human is involved the agent stops answering. Two voices replying
    // to the same person is worse than a slower single voice, and a staff
    // member mid-conversation should not be contradicted by a bot.
    if (ticket.escalated) {
      try { await notifyStaffReply(ticket, data.message) } catch (err) { log.error('chat notify', err) }
      return NextResponse.json({ reference: ticket.reference, handedOff: true })
    }

    if (!isAgentConfigured()) {
      if (opened) {
        try { await notifyStaffNewTicket(ticket, data.message) } catch (err) { log.error('chat notify', err) }
      }
      await escalate(ticket.id)
      return await withAccessCookie(
        NextResponse.json({ reference: ticket.reference, handedOff: true }),
        opened, ticket,
      )
    }

    const history = await getMessages(ticket.id, { includeInternal: false })
    const result = await answerSupportQuestion(
      history.slice(0, -1).map(m => ({ author_type: m.author_type, body: m.body })),
      data.message,
      { visitorEmail: ticket.requester_email, ticketId: ticket.id },
    )

    if (result.status !== 'ok' || result.escalate) {
      const note = result.status === 'ok'
        ? result.reply
        : 'Thanks for your message. Someone from the team will reply here shortly.'

      await addMessage(ticket.id, { authorType: 'ai', authorName: 'Wissen-Haus Assistant', body: note })
      await escalate(ticket.id)
      try {
        await (opened ? notifyStaffNewTicket(ticket, data.message) : notifyStaffReply(ticket, data.message))
      } catch (err) { log.error('chat notify', err) }

      return await withAccessCookie(
        NextResponse.json({ reference: ticket.reference, reply: note, handedOff: true }),
        opened, ticket,
      )
    }

    await addMessage(ticket.id, { authorType: 'ai', authorName: 'Wissen-Haus Assistant', body: result.reply })
    await sql`UPDATE support_tickets SET ai_handled = TRUE WHERE id = ${ticket.id}`

    return await withAccessCookie(
      NextResponse.json({ reference: ticket.reference, reply: result.reply, handedOff: false }),
      opened, ticket,
    )
  } catch (err) {
    log.error('support chat', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// Only the response that opened a ticket carries the cookie; later turns in
// the same conversation already have it.
async function withAccessCookie(res: NextResponse, opened: boolean, ticket: { id: string; reference: string }) {
  if (!opened) return res
  res.cookies.set(TICKET_TOKEN_COOKIE, await mintAccessToken(ticket.id, ticket.reference), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: 90 * 24 * 60 * 60,
  })
  return res
}

async function escalate(ticketId: string) {
  await sql`UPDATE support_tickets SET escalated = TRUE, status = 'open' WHERE id = ${ticketId}`
}
