import { describe, it, expect } from 'vitest'
import { renderEmailFooter, shell, FOOTER_START, FOOTER_END, DEFAULT_TAGLINE } from './email-shell'

// The Resend templates carry a pasted copy of this footer, so these lines are
// the contract: change them here and the templates must change with them.
describe('renderEmailFooter', () => {
  const footer = renderEmailFooter()

  it('shows the agreed organisation, office and contact lines', () => {
    expect(footer).toContain('Wissen Haus Foundation<br/>')
    expect(footer).toContain('NGA: Ibadan, Oyo State · <a href="tel:+234800947736">+234800947736</a>')
    expect(footer).toContain('UK: Manchester, England · <a href="tel:+443302201562">+443302201562</a>')
    expect(footer).toContain('<a href="mailto:info@wissenhaus.org">info@wissenhaus.org</a>')
    expect(footer).toContain('<a href="https://www.wissenhaus.org/">wissenhaus.org</a>')
  })

  it('shows the agreed social and legal links', () => {
    expect(footer).toContain('href="https://www.instagram.com/wissen_haus"')
    expect(footer).toContain('href="https://www.linkedin.com/company/wissen-haus-empowerment-foundation"')
    expect(footer).toContain('href="https://www.wissenhaus.org/privacy">Privacy Policy')
    expect(footer).toContain('href="https://www.wissenhaus.org/terms">Terms &amp; Conditions')
    expect(footer).toContain('href="https://www.wissenhaus.org/safeguarding">Safeguarding')
    expect(footer).toContain('href="https://www.wissenhaus.org/policy-research">Policy &amp; Research')
  })

  it('uses the agreed copyright line, with the current year', () => {
    const year = new Date().getFullYear()
    expect(footer).toContain(
      `© ${year} Wissen Haus Foundation UK &amp; Wissen Haus Empowerment Foundation NGA. All rights reserved.`,
    )
  })

  it('leads with the tagline, which a caller can override', () => {
    expect(footer.startsWith(`<strong>${DEFAULT_TAGLINE}</strong>`)).toBe(true)
    expect(renderEmailFooter('Custom line').startsWith('<strong>Custom line</strong>')).toBe(true)
  })

  it('is what shell() places between the footer markers', () => {
    const html = shell('<p>x</p>')
    const start = html.indexOf(FOOTER_START) + FOOTER_START.length
    const end = html.indexOf(FOOTER_END)
    expect(html.slice(start, end)).toBe(renderEmailFooter(DEFAULT_TAGLINE))
  })
})
