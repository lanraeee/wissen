// Canonical list of admin-dashboard sections the master admin can grant to a
// trustee account, one at a time. Client-safe (no server imports) so both the
// Access Control editor and lib/admin-access.ts (also client-safe) can use it
// without pulling in the database.
//
// Two kinds of entry:
//  - top-level sections, one per entry in components/admin/AdminNav.tsx's
//    NAV array (same `key` convention: the path with the leading
//    "/admin/" stripped and dashes turned to underscores, or "dashboard"
//    for "/admin" itself).
//  - WHF-CIO Records tabs, prefixed "whf_cio." -- one per tab in
//    app/admin/whf-cio/page.tsx's TABS array, EXCEPT "safeguarding": that
//    tab already has its own, separate grant mechanism
//    (cio_safeguarding_team / isSafeguardingTeam()), built before this
//    system existed. Folding it in here would give two different places
//    that could each independently grant the same tab, so it stays out.
//  - The AI Agent ("/admin/ai") is also deliberately excluded: it already
//    has its own master-admin-controlled allow-list (lib/ai-settings.ts's
//    adminAgentAllowedEmails), for the same reason -- one grant mechanism
//    per sensitive section, not two.

export interface AdminSection {
  key: string
  label: string
  path: string
}

export const TOP_LEVEL_SECTIONS: AdminSection[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin' },
  { key: 'analytics', label: 'Analytics', path: '/admin/analytics' },
  { key: 'knowledge', label: 'Knowledge Base', path: '/admin/knowledge' },
  { key: 'activity', label: 'Activity Log', path: '/admin/activity' },
  { key: 'users', label: 'Users', path: '/admin/users' },
  { key: 'support', label: 'Support', path: '/admin/support' },
  { key: 'contact', label: 'Contact', path: '/admin/contact' },
  { key: 'volunteer', label: 'Volunteers', path: '/admin/volunteer' },
  { key: 'partner', label: 'Partners', path: '/admin/partner' },
  { key: 'donations', label: 'Donations', path: '/admin/donations' },
  { key: 'bank_transfers', label: 'Bank Transfers', path: '/admin/bank-transfers' },
  { key: 'giving', label: 'Monthly Giving', path: '/admin/giving' },
  { key: 'scholarships', label: 'Scholarships', path: '/admin/scholarships' },
  { key: 'opportunities', label: 'Opportunities', path: '/admin/opportunities' },
  { key: 'courses', label: 'Courses & Certs', path: '/admin/courses' },
  { key: 'projects', label: 'Donation Projects', path: '/admin/projects' },
  { key: 'career_fair', label: 'Career Fair', path: '/admin/career-fair' },
  { key: 'testimonials', label: 'Testimonials', path: '/admin/testimonials' },
  { key: 'content', label: 'Content', path: '/admin/content' },
  { key: 'content_approvals', label: 'Content Approvals', path: '/admin/content-approvals' },
  // No bare "whf_cio" entry: access to WHF-CIO Records is entirely a
  // function of which whf_cio.* tabs below are granted (sectionsCoveringPath
  // and grantedWhfCioTabs both only look at those) -- a standalone
  // "whf_cio" key would be a checkbox that does nothing.
  { key: 'newsletter', label: 'Newsletter', path: '/admin/newsletter' },
  { key: 'email_templates', label: 'Email Templates', path: '/admin/email-templates' },
  { key: 'settings', label: 'Settings', path: '/admin/settings' },
]

// WHF-CIO Records tabs, matching app/admin/whf-cio/page.tsx's TABS keys
// exactly (prefixed). "safeguarding" is intentionally absent -- see above.
export const WHF_CIO_SECTIONS: AdminSection[] = [
  { key: 'whf_cio.trustees', label: 'WHF-CIO → Trustees', path: '/admin/whf-cio?tab=trustees' },
  { key: 'whf_cio.trustee_declarations', label: 'WHF-CIO → Trustee Declarations', path: '/admin/whf-cio?tab=trustee_declarations' },
  { key: 'whf_cio.constitution', label: 'WHF-CIO → Constitution', path: '/admin/whf-cio?tab=constitution' },
  { key: 'whf_cio.registrations', label: 'WHF-CIO → Registrations', path: '/admin/whf-cio?tab=registrations' },
  { key: 'whf_cio.meetings', label: 'WHF-CIO → Meetings & Minutes', path: '/admin/whf-cio?tab=meetings' },
  { key: 'whf_cio.conflicts', label: 'WHF-CIO → Conflicts of Interest', path: '/admin/whf-cio?tab=conflicts' },
  { key: 'whf_cio.policies', label: 'WHF-CIO → Policies', path: '/admin/whf-cio?tab=policies' },
  { key: 'whf_cio.filings', label: 'WHF-CIO → Filings & Compliance', path: '/admin/whf-cio?tab=filings' },
  { key: 'whf_cio.documents', label: 'WHF-CIO → Documents', path: '/admin/whf-cio?tab=documents' },
  { key: 'whf_cio.ledger', label: 'WHF-CIO → Financial Ledger', path: '/admin/whf-cio?tab=ledger' },
  { key: 'whf_cio.costs', label: 'WHF-CIO → Operational Fixed Costs', path: '/admin/whf-cio?tab=costs' },
]

export const ALL_SECTIONS: AdminSection[] = [...TOP_LEVEL_SECTIONS, ...WHF_CIO_SECTIONS]
export const SECTION_KEYS = ALL_SECTIONS.map(s => s.key)
export const SECTION_BY_KEY: Record<string, AdminSection> = Object.fromEntries(ALL_SECTIONS.map(s => [s.key, s]))

function pathMatches(path: string, prefix: string) {
  return path === prefix || path.startsWith(prefix + '/')
}

/** Every granted top-level section whose path covers this request path. Granting any whf_cio.* tab implicitly covers the /admin/whf-cio route itself (the page does its own tab filtering from the same grant list). */
export function sectionsCoveringPath(grantedKeys: string[], path: string): boolean {
  if (grantedKeys.some(k => k.startsWith('whf_cio.')) && pathMatches(path, '/admin/whf-cio')) return true
  return TOP_LEVEL_SECTIONS.some(s => grantedKeys.includes(s.key) && pathMatches(path, s.path))
}

/** The granted whf_cio.* tab keys, with the prefix stripped (e.g. "trustees"), for app/admin/whf-cio/page.tsx's tab filter. */
export function grantedWhfCioTabs(grantedKeys: string[]): string[] {
  return grantedKeys.filter(k => k.startsWith('whf_cio.')).map(k => k.slice('whf_cio.'.length))
}

/** Where to send a trustee once they're known not to have access to the path they requested. */
export function firstGrantedPath(grantedKeys: string[]): string | null {
  if (grantedKeys.some(k => k.startsWith('whf_cio.'))) return `/admin/whf-cio?tab=${grantedWhfCioTabs(grantedKeys)[0]}`
  const first = TOP_LEVEL_SECTIONS.find(s => grantedKeys.includes(s.key))
  return first?.path ?? null
}
