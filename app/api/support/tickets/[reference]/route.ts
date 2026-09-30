import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseBody, zLongText } from '@/lib/validation'
import { getTicketByReference, getMessages, addMessage } from '@/lib/tickets'
import { notifyStaffReply } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// The reference IS the credential here -- a visitor with no account reads and
// replies to their own thread by holding it. That is why generateReference()
// mints ~50 bits of randomness, and why this route is rate limited: it is an
// unauthenticated read of conversation content.
//
// Internal staff notes are excluded by getMessages()' default.
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const ticket = await getTicketByReference(reference)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const since = req.nextUrl.searchParams.get('since') ?? undefined
  const messages = await getMessages(ticket.id, { since })

  return NextResponse.json({
    ticket: {
      reference: ticket.reference,
      subject: ticket.subject,
      status: ticket.status,
      created_at: ticket.created_at,
      escalated: ticket.escalated,
    },
    messages,
  })
}

const ReplySchema = z.object({
  message: zLongText,
  audioId: z.string().uuid().nullish(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const { data, error } = await parseBody(req, ReplySchema)
  if (error) return error

  const ticket = await getTicketByReference(reference)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'This ticket is closed. Please open a new one.' }, { status: 409 })
  }

  const message = await addMessage(ticket.id, {
    authorType: 'visitor',
    authorName: ticket.requester_name,
    body: data.message,
    audioId: data.audioId ?? null,
  })

  try {
    await notifyStaffReply(ticket, data.message)
  } catch (err) {
    log.error('support reply email', err)
  }

  return NextResponse.json({ success: true, message })
}
