import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { getTicketByReference, getMessages, addMessage } from '@/lib/tickets'
import { sendStaffReplyToRequester } from '@/lib/email'
import { proposeAnswerEntry } from '@/lib/knowledge-base'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { reference } = await params

  const ticket = await getTicketByReference(reference)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Staff see internal notes; the visitor-facing route never does.
  const messages = await getMessages(ticket.id, { includeInternal: true })
  return NextResponse.json({ ticket, messages })
}

const ActionSchema = z.object({
  reply: z.string().max(5000).nullish(),
  internal: z.boolean().nullish(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).nullish(),
  /** Hand the conversation back to the assistant (undoes the escalation). */
  handBackToAi: z.boolean().nullish(),
  priority: z.enum(['low', 'normal', 'high']).nullish(),
  assignedEmail: z.string().email().max(200).nullable().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { reference } = await params

  const { data, error } = await parseBody(req, ActionSchema)
  if (error) return error

  const ticket = await getTicketByReference(reference)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (data.reply?.trim()) {
    const internal = data.internal === true
    await addMessage(ticket.id, {
      authorType: 'staff',
      authorName: session.name || 'Wissen-Haus team',
      body: data.reply.trim(),
      internal,
    })

    // A staff reply takes the conversation off the agent: two voices answering
    // one person is worse than one slower voice. It can be handed back
    // deliberately below, but never silently.
    if (!internal) {
      await sql`UPDATE support_tickets SET escalated = TRUE WHERE id = ${ticket.id}`
      try {
        await sendStaffReplyToRequester(ticket, data.reply.trim())
      } catch (err) {
        log.error('support staff reply email', err)
      }

      // Answering a question the agent could not is the moment worth learning
      // from. The visitor's first message is the question; this reply is the
      // answer. It is proposed as PENDING -- an answer that was right for this
      // person is not automatically right for everyone, so a human approves it
      // before the agent may reuse it.
      if (ticket.ai_handled || ticket.escalated) {
        const [first] = await getMessages(ticket.id, { includeInternal: false })
        if (first?.author_type === 'visitor') {
          await proposeAnswerEntry(first.body, data.reply.trim(), ticket.reference)
        }
      }
    }
  }

  // Handing back to the assistant. Explicit, and recorded in the thread so the
  // visitor is not silently switched from a person to a bot mid-conversation.
  if (data.handBackToAi) {
    await sql`UPDATE support_tickets SET escalated = FALSE, status = 'open' WHERE id = ${ticket.id}`
    await addMessage(ticket.id, {
      authorType: 'staff',
      authorName: session.name || 'Wissen-Haus team',
      body: 'Handed this conversation back to the assistant.',
      internal: true,
    })
  }

  if (data.status) await sql`UPDATE support_tickets SET status = ${data.status} WHERE id = ${ticket.id}`
  if (data.priority) await sql`UPDATE support_tickets SET priority = ${data.priority} WHERE id = ${ticket.id}`
  if (data.assignedEmail !== undefined) {
    await sql`UPDATE support_tickets SET assigned_email = ${data.assignedEmail} WHERE id = ${ticket.id}`
  }

  logActivity(session, 'support.update', { targetType: 'support_ticket', targetId: ticket.reference })
  return NextResponse.json({ success: true })
}
