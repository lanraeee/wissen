import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTicketByReference, getMessages } from '@/lib/tickets'
import TicketThread from '@/components/support/TicketThread'

// A ticket thread is private to whoever holds the reference, so it must never
// be indexed or shown in a search result.
export const metadata: Metadata = {
  title: 'Your support ticket · Wissen-Haus',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function TicketPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const ticket = await getTicketByReference(reference)
  if (!ticket) notFound()

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
