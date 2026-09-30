import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTicketByReference, getMessages } from '@/lib/tickets'
import AdminTicketDetail from '@/components/admin/AdminTicketDetail'

export const metadata: Metadata = { title: 'Ticket · Admin · Wissen-Haus' }
export const dynamic = 'force-dynamic'

export default async function AdminTicketPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const ticket = await getTicketByReference(reference)
  if (!ticket) notFound()

  const messages = await getMessages(ticket.id, { includeInternal: true })
  return <AdminTicketDetail ticket={ticket} initialMessages={messages} />
}
