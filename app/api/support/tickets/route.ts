import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { parseBody, zEmail, zName, zShortText, zLongText } from '@/lib/validation'
import { createTicket } from '@/lib/tickets'
import { visitorContextFrom } from '@/lib/visitor-context'
import { sendTicketOpened, notifyStaffNewTicket } from '@/lib/email'
import { log } from '@/lib/logger'

const CreateSchema = z.object({
  name: zName,
  email: zEmail.nullish(),
  subject: zShortText,
  message: zLongText,
  channel: z.enum(['form', 'chat']).nullish(),
  audioId: z.string().uuid().nullish(),
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
      audioId: data.audioId ?? null,
      context: visitorContextFrom(req, { page: data.page, referrer: data.referrer }),
    })

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

    return NextResponse.json({ success: true, reference: ticket.reference, id: ticket.id })
  } catch (err) {
    log.error('support ticket create', err)
    return NextResponse.json({ error: 'Could not open a ticket right now' }, { status: 500 })
  }
}
