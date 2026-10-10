import { NextResponse } from 'next/server'
import { adminGuard, trusteeSectionsGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

// Pending-count-per-resource, used to badge each dedicated admin nav item so
// staff can see what needs attention without opening every page. Donations
// have no pending concept (a completed ledger, not a triage queue) so
// they're not counted here.
export async function GET() {
  const staff = await adminGuard()
  const trustee = staff ? null : await trusteeSectionsGuard()
  if (!staff && !trustee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // A trustee is only told about the queues for sections they hold.
  const may = (section: string) => !trustee || trustee.sections.includes(section)
  const [contact, volunteer, partner, bankTransfer, scholarship, contentApproval, support, kbPending] = await Promise.all([
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
    // Team answers waiting to be approved into the knowledge base.
    sql`SELECT COUNT(*)::int AS c FROM kb_entries WHERE status = 'pending'`,
  ])
  return NextResponse.json({
    contact: may('contact') ? contact[0].c as number : 0,
    volunteer: may('volunteer') ? volunteer[0].c as number : 0,
    partner: may('partner') ? partner[0].c as number : 0,
    bank_transfer: may('bank_transfers') ? bankTransfer[0].c as number : 0,
    scholarship: may('scholarships') ? scholarship[0].c as number : 0,
    content_approval: may('content_approvals') ? contentApproval[0].c as number : 0,
    support: may('support') ? support[0].c as number : 0,
    kb_pending: may('knowledge') ? kbPending[0].c as number : 0,
  })
}
