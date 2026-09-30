import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

// Pending-count-per-resource, used to badge each dedicated admin nav item so
// staff can see what needs attention without opening every page. Donations
// have no pending concept (a completed ledger, not a triage queue) so
// they're not counted here.
export async function GET() {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const [contact, volunteer, partner, bankTransfer, scholarship, contentApproval, support] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM contact_messages WHERE status = 'pending'`,
    sql`SELECT COUNT(*)::int AS c FROM volunteer_applications WHERE status = 'pending'`,
    sql`SELECT COUNT(*)::int AS c FROM partner_inquiries WHERE status = 'pending'`,
    sql`SELECT COUNT(*)::int AS c FROM bank_transfers WHERE status IN ('awaiting_transfer', 'declared_sent')`,
    sql`SELECT COUNT(*)::int AS c FROM scholarship_applications WHERE status = 'pending'`,
    sql`SELECT COUNT(*)::int AS c FROM content_change_requests WHERE status = 'pending'`,
    // Only tickets a human still has to touch: one the assistant answered and
    // closed out is not waiting on anybody, so badging it would train staff to
    // ignore the number.
    sql`SELECT COUNT(*)::int AS c FROM support_tickets WHERE status = 'open' AND escalated = TRUE`,
  ])
  return NextResponse.json({
    contact: contact[0].c as number,
    volunteer: volunteer[0].c as number,
    partner: partner[0].c as number,
    bank_transfer: bankTransfer[0].c as number,
    scholarship: scholarship[0].c as number,
    content_approval: contentApproval[0].c as number,
    support: support[0].c as number,
  })
}
