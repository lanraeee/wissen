// Scholarships/free-access programmes Wissen-Haus offers directly through
// its own partnerships -- shown on the /scholarships page's "Wissen-Haus
// Partners" tab and editable at admin/content?tab=partner-scholarships
// (site_content key 'partner_scholarships').
//
// Deliberately separate from the generic institutional `partners` CMS list
// (site_content key 'partners', shown on /partner): that list is free-form
// and could one day include a partner with no scholarship/access angle at
// all (a media partner, a bank, etc.), so rendering every entry there as a
// "scholarship" would misrepresent it.
//
// No server-only imports here: the admin editor is a client component, so
// the type and defaults have to be safe to ship to the browser. Pages read
// the saved list with getSiteContent() and pass it in as a prop.
export interface PartnerScholarship {
  name: string
  /** A path under /public, or a data: URL when uploaded through the admin editor. */
  logo: string
  description: string
  /** Public info page for the partnership. */
  infoHref: string
  /** The application form. Internal /partners/<x>/apply routes are members-only (see middleware.ts). */
  applyHref: string
  applyLabel: string
}

export const DEFAULT_PARTNER_SCHOLARSHIPS: PartnerScholarship[] = [
  {
    name: 'DataCamp Donates',
    logo: '/img/partners/datacamp-logo.jpg',
    description: 'Free access to 500+ premium data science, AI and analytics courses for motivated students facing genuine financial or access barriers.',
    infoHref: '/partners/datacamp',
    applyHref: '/partners/datacamp/apply',
    applyLabel: 'Apply for a Scholarship',
  },
]
