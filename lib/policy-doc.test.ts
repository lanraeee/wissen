import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import PolicyDocument from '@/components/PolicyDocument'
import { POLICY_DEFAULTS } from './policy-doc-defaults'
import { coerceSections, parseBody, parseInline, safeHref, slugify, withIds } from './policy-doc'

describe('policy markup', () => {
  it('parses paragraphs, bullets and numbered lists', () => {
    const b = parseBody('Intro **bold** text\n\n- one\n- two\n\n1. a\n2. b')
    expect(b.map(x => x.kind)).toEqual(['p', 'ul', 'ol'])
    expect(b[1]).toMatchObject({ items: [[{ t: 'one' }], [{ t: 'two' }]] })
  })
  it('parses links, code and emphasis', () => {
    expect(parseInline('see [Terms](/terms) and `x` and *y*')).toEqual([
      { t: 'see ' }, { t: 'Terms', href: '/terms' }, { t: ' and ' }, { t: 'x', code: true }, { t: ' and ' }, { t: 'y', i: true },
    ])
  })
  it('refuses unsafe link targets', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('//evil.com')).toBeNull()
    expect(safeHref('data:text/html,x')).toBeNull()
    expect(safeHref('mailto:a@b.org')).toBe('mailto:a@b.org')
    expect(parseInline('[x](javascript:go)')).toEqual([{ t: 'x' }])
  })
  it('never emits raw HTML', () => {
    const html = renderToStaticMarkup(createElement(PolicyDocument, { sections: [{ id: 'a', title: '<img src=x onerror=1>', body: '<script>alert(1)</script> **b**' }] }))
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })
  it('gives unique anchor ids', () => {
    const ids = withIds([{ id: '', title: 'Who We Are', body: '' }, { id: '', title: 'Who we are', body: '' }, { id: 'Bad Id!', title: 'x', body: '' }]).map(s => s.id)
    expect(ids).toEqual(['who-we-are', 'who-we-are-2', 'x'])
    expect(slugify('!!!')).toBe('section')
  })
  it('rejects unusable saved values so the built-in text is used', () => {
    for (const v of [null, {}, { sections: [] }, { sections: 'x' }, { sections: [{ title: '', body: '' }] }, { sections: [{ title: 'a', body: 1 }] }]) {
      expect(coerceSections(v)).toBeNull()
    }
    expect(coerceSections({ sections: [{ title: 'a', body: 'b' }] })).toEqual([{ id: 'a', title: 'a', body: 'b' }])
  })
})

describe('built-in policy text', () => {
  for (const [slug, secs] of Object.entries(POLICY_DEFAULTS)) {
    it(`${slug} renders every section with no leftover markup`, () => {
      const sections = withIds(secs)
      const html = renderToStaticMarkup(createElement(PolicyDocument, { sections }))
      expect((html.match(/<h2 /g) ?? []).length).toBe(sections.length)
      const text = html.replace(/<[^>]+>/g, ' ')
      expect(text).not.toMatch(/\*\*|\]\(|&amp;amp;|&lt;\/?(strong|p|a|li)/)
      expect(new Set(sections.map(s => s.id)).size).toBe(sections.length)
    })
  }
})
