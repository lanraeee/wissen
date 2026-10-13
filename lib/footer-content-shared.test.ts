import { describe, it, expect } from 'vitest'
import {
  FOOTER_DEFAULTS,
  FOOTER_LIMITS,
  footerCopyright,
  isExternalFooterHref,
  isSafeFooterHref,
  normalizeFooterContent,
} from './footer-content-shared'

describe('isSafeFooterHref', () => {
  it.each(['/programmes', '/community?tab=jobs#opportunities', '#top', 'https://wissenhaus.org', 'mailto:info@wissenhaus.org', 'tel:+441234567890'])('allows %s', href => {
    expect(isSafeFooterHref(href)).toBe(true)
  })

  it.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<script>', '//evil.example', 'programmes', '', '   ', 'vbscript:msgbox'])('refuses %j', href => {
    expect(isSafeFooterHref(href)).toBe(false)
  })

  it('refuses hrefs over the length limit', () => {
    expect(isSafeFooterHref('/' + 'a'.repeat(FOOTER_LIMITS.href))).toBe(false)
  })
})

describe('isExternalFooterHref', () => {
  it('treats http, mailto and tel as external and paths as internal', () => {
    expect(isExternalFooterHref('https://x.org')).toBe(true)
    expect(isExternalFooterHref('mailto:a@b.c')).toBe(true)
    expect(isExternalFooterHref('tel:+1')).toBe(true)
    expect(isExternalFooterHref('/about')).toBe(false)
    expect(isExternalFooterHref('#x')).toBe(false)
  })
})

describe('normalizeFooterContent', () => {
  it('returns the built-in defaults when nothing is stored', () => {
    expect(normalizeFooterContent(null)).toEqual(FOOTER_DEFAULTS)
    expect(normalizeFooterContent(undefined)).toEqual(FOOTER_DEFAULTS)
    expect(normalizeFooterContent('not an object')).toEqual(FOOTER_DEFAULTS)
    expect(normalizeFooterContent([])).toEqual(FOOTER_DEFAULTS)
  })

  it('passes the defaults through the sanitiser unchanged, so the footer looks the same before any save', () => {
    expect(normalizeFooterContent(FOOTER_DEFAULTS)).toEqual(FOOTER_DEFAULTS)
  })

  it('keeps the defaults exactly as they shipped (two link columns, four bottom links)', () => {
    expect(FOOTER_DEFAULTS.columns.map(c => c.title)).toEqual(['Explore', 'Get Involved'])
    expect(FOOTER_DEFAULTS.columns[0].links).toHaveLength(9)
    expect(FOOTER_DEFAULTS.columns[1].links).toHaveLength(6)
    expect(FOOTER_DEFAULTS.bottomLinks.map(l => l.label)).toEqual(['Privacy Policy', 'Terms & Conditions', 'Safeguarding', 'Financial Ledger'])
  })

  it('drops links with an unsafe href or no label, and keeps the rest in order', () => {
    const out = normalizeFooterContent({
      columns: [
        { title: 'Explore', links: [
          { label: 'Good', href: '/good' },
          { label: 'Bad scheme', href: 'javascript:alert(1)' },
          { label: '', href: '/no-label' },
          { label: 'Also good', href: 'https://example.org' },
        ] },
        { title: 'Get Involved', links: [] },
      ],
    })
    expect(out.columns[0].links).toEqual([
      { label: 'Good', href: '/good' },
      { label: 'Also good', href: 'https://example.org' },
    ])
  })

  it('treats a saved empty link list as a deliberate choice, not a reason to restore defaults', () => {
    const out = normalizeFooterContent({ columns: [{ title: 'Explore', links: [] }, { title: 'Get Involved', links: [] }], bottomLinks: [] })
    expect(out.columns[0].links).toEqual([])
    expect(out.bottomLinks).toEqual([])
  })

  it('falls back to defaults for a non-array link list', () => {
    const out = normalizeFooterContent({ columns: [{ title: 'Explore', links: 'nope' }, {}], bottomLinks: 'nope' })
    expect(out.columns[0].links).toEqual(FOOTER_DEFAULTS.columns[0].links)
    expect(out.columns[1].links).toEqual(FOOTER_DEFAULTS.columns[1].links)
    expect(out.bottomLinks).toEqual(FOOTER_DEFAULTS.bottomLinks)
  })

  it('always returns exactly two link columns, ignoring extras', () => {
    const out = normalizeFooterContent({ columns: [{ title: 'A', links: [] }, { title: 'B', links: [] }, { title: 'C', links: [] }] })
    expect(out.columns).toHaveLength(2)
    expect(out.columns.map(c => c.title)).toEqual(['A', 'B'])
  })

  it('uses the default title when a heading is blank', () => {
    const out = normalizeFooterContent({ columns: [{ title: '   ', links: [] }], contactTitle: '' })
    expect(out.columns[0].title).toBe('Explore')
    expect(out.contactTitle).toBe(FOOTER_DEFAULTS.contactTitle)
  })

  it('trims and caps long text', () => {
    const out = normalizeFooterContent({ description: '  ' + 'x'.repeat(FOOTER_LIMITS.description + 50) + '  ' })
    expect(out.description).toHaveLength(FOOTER_LIMITS.description)
    expect(out.description.startsWith('x')).toBe(true)
  })

  it('allows a blank description and a blank tagline (tagline falls back to Contact Details)', () => {
    const out = normalizeFooterContent({ description: '', tagline: '' })
    expect(out.description).toBe('')
    expect(out.tagline).toBe('')
  })

  it('caps the number of links per column', () => {
    const many = Array.from({ length: FOOTER_LIMITS.linksPerColumn + 5 }, (_, i) => ({ label: `L${i}`, href: `/p${i}` }))
    const out = normalizeFooterContent({ columns: [{ title: 'Explore', links: many }, { title: 'Get Involved', links: [] }] })
    expect(out.columns[0].links).toHaveLength(FOOTER_LIMITS.linksPerColumn)
  })
})

describe('footerCopyright', () => {
  it('fills in the year', () => {
    expect(footerCopyright('© {year} Wissen-Haus.', 2026)).toBe('© 2026 Wissen-Haus.')
  })

  it('leaves text without the token alone', () => {
    expect(footerCopyright('All rights reserved.', 2026)).toBe('All rights reserved.')
  })
})
