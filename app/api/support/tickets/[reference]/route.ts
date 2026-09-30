import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseBody, zLongText } from '@/lib/validation'
import { getMessages, addMessage } from '@/lib/tickets'
import { ticketAccess } from '@/lib/ticket-guard'
import { notifyStaffReply } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// The reference identifies a conversation; it no longer opens one. Access
// comes from ticketAccess(): the owning account, or an access token held by
// the browser that opened it, or one redeemed from a magic link sent to the
// ticket's own email address.
//
// A denied request answers 404, identically to a reference that does not
// exist. Distinguishing them would confirm to someone guessing references
// that a given code is real, which is the one thing a guesser is after.
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const access = await ticketAccess(reference, req.nextUrl.searchParams.get('t') ?? undefined)
  if (!access.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { ticket } = access
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
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const access = await ticketAccess(reference, req.nextUrl.searchParams.get('t') ?? undefined)
  if (!access.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await parseBody(req, ReplySchema)
  if (error) return error

  const { ticket } = access
  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'This ticket is closed. Please open a new one.' }, { status: 409 })
  }

  const message = await addMessage(ticket.id, {
    authorType: 'visitor',
    authorName: ticket.requester_name,
    body: data.message,
  })

  try {
    await notifyStaffReply(ticket, data.message)
  } catch (err) {
    log.error('support reply email', err)
  }

  return NextResponse.json({ success: true, message })
}
