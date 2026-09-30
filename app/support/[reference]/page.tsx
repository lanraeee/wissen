import type { Metadata } from 'next'
import { getMessages } from '@/lib/tickets'
import { ticketAccess } from '@/lib/ticket-guard'
import TicketThread from '@/components/support/TicketThread'
import TicketAccessForm from '@/components/support/TicketAccessForm'

// A ticket thread is private to the visitor it belongs to, so it must never be
// indexed or shown in a search result.
export const metadata: Metadata = {
  title: 'Your support ticket · Wissen-Haus',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ expired?: string }>
}) {
  const { reference } = await params
  const { expired } = await searchParams

  const access = await ticketAccess(reference)

  // No notFound() here even when the reference is unknown. The access form is
  // shown either way, so a stranger cannot tell a real reference from an
  // invented one by whether they get a 404 -- and a genuine visitor whose
  // cookie has expired gets a way back in rather than a dead end.
  if (!access.ok) {
    return (
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <span className="eyebrow">Support</span>
          <h1 className="display-md mt-s">Open your conversation</h1>
          <p className="lead mt-s" style={{ fontSize: '.95rem' }}>
            {expired
              ? 'That link has expired. Enter the email address on the conversation and we’ll send a fresh one.'
              : 'For your privacy, conversations are locked to the email address they were started with. Enter it and we’ll email you a link to open this one.'}
          </p>
          <div className="mt-l">
            <TicketAccessForm reference={reference} />
          </div>
        </div>
      </section>
    )
  }

  const { ticket } = access
  const messages = await getMessages(ticket.id)

  return (
    <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <span className="eyebrow">Support · {ticket.reference}</span>
        <h1 className="display-md mt-s">{ticket.subject}</h1>
        <p className="lead mt-s" style={{ fontSize: '.95rem' }}>
          Status: <strong>{ticket.status}</strong>
          {ticket.status === 'closed' && ' — this conversation is closed. Open a new ticket if you still need help.'}
        </p>
        <div className="mt-l">
          <TicketThread
            reference={ticket.reference}
            initialMessages={messages}
            closed={ticket.status === 'closed'}
          />
        </div>
      </div>
    </section>
  )
}
