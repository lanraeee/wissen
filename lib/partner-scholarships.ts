// Scholarships/free-access programmes Wissen-Haus offers directly through
// its own partnerships (currently just DataCamp Donates) -- shown on the
// /scholarships page's "Wissen-Haus Partners" tab. Deliberately separate
// from the generic institutional `partners` CMS list (site_content key
// 'partners', edited via admin/content?tab=partners and shown on /partner):
// that list is free-form and could one day include a partner with no
// scholarship/access angle at all (a media partner, a bank, etc.), so
// rendering every entry there as a "scholarship" would misrepresent it.
// This list stays hand-curated and small on purpose.
export interface PartnerScholarship {
  name: string
  logo: string
  description: string
  infoHref: string
  applyHref: string
  applyLabel: string
}

export const PARTNER_SCHOLARSHIPS: PartnerScholarship[] = [
  {
    name: 'DataCamp Donates',
    logo: '/img/partners/datacamp-logo.jpg',
    description: 'Free access to 500+ premium data science, AI and analytics courses for motivated students facing genuine financial or access barriers.',
    infoHref: '/partners/datacamp',
    applyHref: '/partners/datacamp/apply',
    applyLabel: 'Apply for a Scholarship',
  },
]
