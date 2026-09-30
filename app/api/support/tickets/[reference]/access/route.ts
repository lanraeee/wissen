import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseBody, zEmail } from '@/lib/validation'
import { getTicketByReference } from '@/lib/tickets'
import { emailMatches } from '@/lib/ticket-guard'
import { mintMagicToken, mintAccessToken, TICKET_TOKEN_COOKIE } from '@/lib/ticket-access'
import { ticketFromToken } from '@/lib/ticket-access'
import { sendTicketAccessLink } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const RequestSchema = z.object({ email: zEmail })

// Proving you are the visitor: supply the address the conversation is locked
// to, and we email a link back to it. Control of the inbox is the proof --
// nothing in the response reveals whether the reference exists or whether the
// address was right, because both of those are things a stranger probing
// references would otherwise learn from the difference.
export async function POST(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const { data, error } = await parseBody(req, RequestSchema)
  if (error) return error

  const generic = NextResponse.json({
    success: true,
    message: 'If that address matches this conversation, we have emailed a link to open it.',
  })

  try {
    const ticket = await getTicketByReference(reference)
    if (!ticket || !emailMatches(ticket, data.email)) return generic

    const token = await mintMagicToken(ticket.id, ticket.reference)
    await sendTicketAccessLink(ticket, token)
  } catch (err) {
    // Still answer generically: an error here must not become the signal that
    // distinguishes a real reference from an invented one.
    log.error('support access link', err)
  }

  return generic
}

// Redeems a magic link: swaps the short-lived emailed token for the long-lived
// access cookie, so the link in the inbox stops being the thing that grants
// entry after the first use.
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const token = req.nextUrl.searchParams.get('t') ?? undefined

  const ticketId = await ticketFromToken(token, reference, 'magic')
  if (!ticketId) {
    return NextResponse.redirect(new URL(`/support/${encodeURIComponent(reference)}?expired=1`, req.url))
  }

  const res = NextResponse.redirect(new URL(`/support/${encodeURIComponent(reference)}`, req.url))
  res.cookies.set(TICKET_TOKEN_COOKIE, await mintAccessToken(ticketId, reference), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: 90 * 24 * 60 * 60,
  })
  return res
}
