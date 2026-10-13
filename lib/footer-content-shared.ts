// Client-safe footer content: types, the built-in defaults (the footer exactly
// as it shipped before this tab existed) and a sanitiser. No server imports, so
// the admin editor and the public footer share one definition.
//
// Stored under site_content key FOOTER_CONTENT_KEY. Addresses, phone numbers,
// social URLs and the tagline stay in Contact Details (single source for emails
// and the contact page); this shape holds only footer-specific text and links.

export const FOOTER_CONTENT_KEY = 'site_footer'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterContent {
  description: string
  // Always two link columns (Explore, Get Involved). The contact column is
  // separate because its lines come from Contact Details.
  columns: [FooterColumn, FooterColumn]
  contactTitle: string
  contactLinkLabel: string
  // "{year}" is replaced with the current year when rendered.
  copyright: string
  // Blank means: use the tagline from Contact Details.
  tagline: string
  bottomLinks: FooterLink[]
  watermark: string
}

export const FOOTER_LIMITS = {
  description: 400,
  title: 60,
  label: 80,
  href: 300,
  copyright: 160,
  tagline: 120,
  watermark: 40,
  linksPerColumn: 15,
  bottomLinks: 8,
} as const

export const FOOTER_DEFAULTS: FooterContent = {
  description: 'Bridging the skills gap for African youth and the diaspora, equipping young people with practical guidance, mentorship and global exposure for economic independence.',
  columns: [
    {
      title: 'Explore',
      links: [
        { label: 'Programmes', href: '/programmes' },
        { label: 'Community Hub', href: '/community' },
        { label: 'Remote Jobs', href: '/community?tab=jobs#opportunities' },
        { label: 'Internships', href: '/community?tab=internships#opportunities' },
        { label: 'Scholarships', href: '/community?tab=scholarships#opportunities' },
        { label: 'Competitions', href: '/community?tab=competitions#opportunities' },
        { label: 'Impact Stories', href: '/impact-content' },
        { label: 'Policy & Research', href: '/policy-research' },
        { label: 'Foundation Overview', href: '/wiki' },
      ],
    },
    {
      title: 'Get Involved',
      links: [
        { label: 'Volunteer', href: '/volunteer' },
        { label: 'Careers', href: '/careers' },
        { label: 'Partner With Us', href: '/partner' },
        { label: 'Donate', href: '/donate' },
        { label: 'Contact', href: '/contact' },
        { label: 'Support', href: '/support' },
      ],
    },
  ],
  contactTitle: 'Contact',
  contactLinkLabel: 'Send us a message',
  copyright: '© {year} Wissen-Haus. All rights reserved.',
  tagline: '',
  bottomLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Safeguarding', href: '/safeguarding' },
    { label: 'Financial Ledger', href: '/transparency/ledger' },
  ],
  watermark: 'WISSEN-HAUS',
}

/**
 * True for hrefs an admin may put in the footer: site paths, in-page anchors,
 * http(s), mailto and tel. Anything else (javascript:, data:, protocol-relative
 * //host) is refused, so the footer can never carry a script URL.
 */
export function isSafeFooterHref(href: string): boolean {
  const h = href.trim()
  if (!h || h.length > FOOTER_LIMITS.href) return false
  if (h.startsWith('//')) return false
  if (h.startsWith('/') || h.startsWith('#')) return true
  return /^(https?:\/\/|mailto:|tel:)/i.test(h)
}

/** True when the link opens outside the site (gets target=_blank). */
export function isExternalFooterHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href.trim())
}

function text(v: unknown, fallback: string, max: number): string {
  if (typeof v !== 'string') return fallback
  return v.trim().slice(0, max)
}

// A stored array is kept as the admin saved it (an empty list is a valid
// choice), minus any entry with no label or an unsafe href. Only a value that
// is not an array at all falls back to the default list.
function links(v: unknown, fallback: FooterLink[], labelMax: number, limit: number): FooterLink[] {
  if (!Array.isArray(v)) return fallback
  const out: FooterLink[] = []
  for (const item of v) {
    if (out.length >= limit) break
    if (!item || typeof item !== 'object') continue
    const label = text((item as { label?: unknown }).label, '', labelMax)
    const href = text((item as { href?: unknown }).href, '', FOOTER_LIMITS.href)
    if (!label || !isSafeFooterHref(href)) continue
    out.push({ label, href })
  }
  return out
}

/**
 * Turns whatever is stored into a complete, safe FooterContent. Anything
 * missing or malformed falls back to the default, and unsafe links are dropped,
 * so a bad save can never break the public footer.
 */
export function normalizeFooterContent(raw: unknown): FooterContent {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
  const cols = Array.isArray(r.columns) ? r.columns : []
  const columns = FOOTER_DEFAULTS.columns.map((def, i) => {
    const c = cols[i] && typeof cols[i] === 'object' ? cols[i] as Record<string, unknown> : {}
    return {
      title: text(c.title, def.title, FOOTER_LIMITS.title) || def.title,
      links: links(c.links, def.links, FOOTER_LIMITS.label, FOOTER_LIMITS.linksPerColumn),
    }
  }) as [FooterColumn, FooterColumn]

  return {
    description: text(r.description, FOOTER_DEFAULTS.description, FOOTER_LIMITS.description),
    columns,
    contactTitle: text(r.contactTitle, FOOTER_DEFAULTS.contactTitle, FOOTER_LIMITS.title) || FOOTER_DEFAULTS.contactTitle,
    contactLinkLabel: text(r.contactLinkLabel, FOOTER_DEFAULTS.contactLinkLabel, FOOTER_LIMITS.label) || FOOTER_DEFAULTS.contactLinkLabel,
    copyright: text(r.copyright, FOOTER_DEFAULTS.copyright, FOOTER_LIMITS.copyright) || FOOTER_DEFAULTS.copyright,
    tagline: text(r.tagline, FOOTER_DEFAULTS.tagline, FOOTER_LIMITS.tagline),
    bottomLinks: links(r.bottomLinks, FOOTER_DEFAULTS.bottomLinks, FOOTER_LIMITS.label, FOOTER_LIMITS.bottomLinks),
    watermark: text(r.watermark, FOOTER_DEFAULTS.watermark, FOOTER_LIMITS.watermark),
  }
}

/** Replaces {year} in the copyright line. */
export function footerCopyright(template: string, year: number): string {
  return template.replace(/\{year\}/g, String(year))
}
