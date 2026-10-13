import { NextResponse } from 'next/server'
import { adminGuard, trusteeSectionsGuard, canAccessSafeguarding } from '@/lib/admin-guard'
import sql from '@/lib/db'

// Count-per-resource, used to badge each dedicated admin nav item so staff can
// see what needs attention without opening every page. Most are triage queues
// (status = pending). Donations and career fair registrations have no status,
// so they count what arrived in the last 7 days. Each badge is shown only to
// roles that can open its section; the safeguarding count is shown only to
// the safeguarding team and the director.
const RECENT_DAYS = 7

export async function GET() {
  const staff = await adminGuard()
  const trustee = staff ? null : await trusteeSectionsGuard()
  if (!staff && !trustee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // A trustee is only told about the queues for sections they hold.
  const may = (section: string) => !trustee || trustee.sections.includes(section)
  const canSafeguard = !!staff && await canAccessSafeguarding(staff.email)
  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString()
  const [contact, volunteer, partner, bankTransfer, scholarship, contentApproval, support, kbPending,
    donationsRecent, givingDeclared, fairRecent, testimonialsPending, safeguardingOpen] = await Promise.all([
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
    sql`SELECT COUNT(*)::int AS c FROM donations WHERE created_at >= ${since}`,
    // Monthly givers who have said this month's transfer is sent, awaiting confirmation.
    sql`SELECT COUNT(*)::int AS c FROM recurring_pledges WHERE status = 'declared'`,
    sql`SELECT COUNT(*)::int AS c FROM fair_registrations WHERE created_at >= ${since}`,
    sql`SELECT COUNT(*)::int AS c FROM testimonials WHERE status = 'pending'`,
    // Concerns nobody has referred or closed yet. Only read when the viewer may see them.
    canSafeguard
      ? sql`SELECT COUNT(*)::int AS c FROM cio_safeguarding_incidents WHERE status IN ('new', 'triaging')`
      : Promise.resolve([{ c: 0 }]),
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
    donations: may('donations') ? donationsRecent[0].c as number : 0,
    giving: may('giving') ? givingDeclared[0].c as number : 0,
    career_fair: may('career_fair') ? fairRecent[0].c as number : 0,
    testimonials: may('testimonials') ? testimonialsPending[0].c as number : 0,
    // Not a section grant: only the safeguarding team and director see this.
    safeguarding: canSafeguard ? safeguardingOpen[0].c as number : 0,
  })
}
