// Every alert the admin side receives: which dashboard badge it shows (if any)
// and which emails it goes to. Client-safe (no server imports), so the Contact
// Details tab can render the same list the code follows.
//
// Keep this in step with the code: when an alert is added or re-routed, update
// its entry here. The `recipient` kinds map onto the editable settings in
// Admin > Content > Contact Details.

export type AlertRecipient =
  | 'admin'            // the Admin Notification Emails list
  | 'contact_topics'   // the general / partnership / volunteer inboxes, by topic
  | 'volunteers_inbox' // inbox_volunteer, plus the admin list
  | 'partners_inbox'   // inbox_partnership, plus the admin list
  | 'safeguarding'     // safeguarding lead, safeguarding team, plus the admin list
  | 'telegram'         // linked Telegram admins (not email)
  | 'none'             // no email; badge only

export interface AdminAlert {
  label: string
  trigger: string
  recipient: AlertRecipient
  // Human text for the badge column, or null when there is no badge.
  badge: string | null
  // The nav path whose badge this is, used to place it on the admin nav.
  badgePath?: string
}

export const ADMIN_ALERTS: AdminAlert[] = [
  { label: 'Contact message', trigger: 'Someone sends the contact form', recipient: 'contact_topics', badge: 'Contact: pending', badgePath: '/admin/contact' },
  { label: 'Volunteer application', trigger: 'Someone applies to volunteer', recipient: 'volunteers_inbox', badge: 'Volunteers: pending', badgePath: '/admin/volunteer' },
  { label: 'Partner inquiry', trigger: 'An organisation submits the partner form', recipient: 'partners_inbox', badge: 'Partners: pending', badgePath: '/admin/partner' },
  { label: 'Donation recorded', trigger: 'A donation is completed (Stripe or Paystack)', recipient: 'admin', badge: 'Donations: new in last 7 days', badgePath: '/admin/donations' },
  { label: 'Bank transfer', trigger: 'A transfer pledge is created or marked as sent', recipient: 'admin', badge: 'Bank Transfers: awaiting or declared sent', badgePath: '/admin/bank-transfers' },
  { label: 'Monthly giving declared', trigger: 'A monthly giver says this month’s transfer is sent', recipient: 'admin', badge: 'Monthly Giving: declared, awaiting confirmation', badgePath: '/admin/giving' },
  { label: 'Scholarship application', trigger: 'A scholarship application is submitted', recipient: 'admin', badge: 'Scholarships: pending', badgePath: '/admin/scholarships' },
  { label: 'Career fair registration', trigger: 'Someone registers for a career fair', recipient: 'admin', badge: 'Career Fair: new in last 7 days', badgePath: '/admin/career-fair' },
  { label: 'Testimonial', trigger: 'Someone submits a testimonial', recipient: 'admin', badge: 'Testimonials: pending', badgePath: '/admin/testimonials' },
  { label: 'Support ticket', trigger: 'A new ticket, or a reply to one', recipient: 'admin', badge: 'Support: open and escalated', badgePath: '/admin/support' },
  { label: 'Safeguarding concern', trigger: 'A concern is reported (any route)', recipient: 'safeguarding', badge: 'WHF-CIO Records: new or triaging concerns (leads and directors only)', badgePath: '/admin/whf-cio' },
  { label: 'Content approval request', trigger: 'A team member asks for content to be approved', recipient: 'none', badge: 'Content Approvals: pending', badgePath: '/admin/content-approvals' },
  { label: 'Knowledge base answer', trigger: 'A team answer is waiting to join the knowledge base', recipient: 'none', badge: 'Knowledge Base: pending', badgePath: '/admin/knowledge' },
  { label: 'Telegram summary', trigger: 'Every six hours', recipient: 'telegram', badge: null },
]
