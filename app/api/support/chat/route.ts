import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { parseBody, zLongText } from '@/lib/validation'
import { createTicket, getTicketByReference, getMessages, addMessage } from '@/lib/tickets'
import { answerSupportQuestion, isAgentConfigured } from '@/lib/support-agent'
import { notifyStaffNewTicket, notifyStaffReply } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ChatSchema = z.object({
  reference: z.string().max(40).nullish(),
  message: zLongText,
  name: z.string().max(120).nullish(),
  email: z.string().email().max(200).nullish(),
  audioId: z.string().uuid().nullish(),
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

  try {
    let ticket = data.reference ? await getTicketByReference(data.reference) : null
    let opened = false

    if (!ticket) {
      ticket = await createTicket({
        subject: data.message.slice(0, 80),
        requesterName: visitorName,
        requesterEmail: session?.email ?? data.email ?? null,
        userId: session?.id ?? null,
        channel: 'chat',
        body: data.message,
        audioId: data.audioId ?? null,
      })
      opened = true
    } else {
      if (ticket.status === 'closed') {
        return NextResponse.json({ error: 'This conversation is closed.' }, { status: 409 })
      }
      await addMessage(ticket.id, {
        authorType: 'visitor',
        authorName: visitorName,
        body: data.message,
        audioId: data.audioId ?? null,
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
      return NextResponse.json({ reference: ticket.reference, handedOff: true })
    }

    const history = await getMessages(ticket.id, { includeInternal: false })
    const result = await answerSupportQuestion(
      history.slice(0, -1).map(m => ({ author_type: m.author_type, body: m.body })),
      data.message,
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

      return NextResponse.json({ reference: ticket.reference, reply: note, handedOff: true })
    }

    await addMessage(ticket.id, { authorType: 'ai', authorName: 'Wissen-Haus Assistant', body: result.reply })
    await sql`UPDATE support_tickets SET ai_handled = TRUE WHERE id = ${ticket.id}`

    return NextResponse.json({ reference: ticket.reference, reply: result.reply, handedOff: false })
  } catch (err) {
    log.error('support chat', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

async function escalate(ticketId: string) {
  await sql`UPDATE support_tickets SET escalated = TRUE, status = 'open' WHERE id = ${ticketId}`
}
