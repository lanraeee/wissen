import { beforeEach, describe, expect, it, vi } from 'vitest'

const store: Record<string, unknown> = {}
vi.mock('./site-content', () => ({ getSiteContent: async (k: string) => store[k] ?? null }))

import { getBrand } from './brand-server'
import { getPolicySections } from './policy-doc-server'
import { getPageCopy } from './page-copy'
import { getOgCopy } from './og'
import { ABOUT_SCHEMA } from './page-copy-schema'
import { ogSchemaFor } from './og-schema'

beforeEach(() => { for (const k of Object.keys(store)) delete store[k] })

describe('brand applied at read time', () => {
  it('uses defaults until settings are saved', async () => {
    expect(await getBrand()).toEqual({ name: 'Wissen-Haus', descriptor: 'Empowerment Foundation' })
    expect((await getPageCopy(ABOUT_SCHEMA)).heroEyebrow).toBe('About Wissen-Haus')
  })
  it('a saved rename shows up in page copy, share previews and policy text', async () => {
    store.site_settings = { brand_name: 'Acme', brand_descriptor: 'Trust' }
    expect((await getPageCopy(ABOUT_SCHEMA)).heroEyebrow).toBe('About Acme')
    const og = await getOgCopy(ogSchemaFor('about')!)
    expect(`${og.title} ${og.ogTitle} ${og.description}`).not.toContain('Wissen-Haus')
    const secs = await getPolicySections('privacy')
    expect(JSON.stringify(secs)).not.toContain('Wissen-Haus')
    expect(JSON.stringify(secs)).toContain('Acme')
  })
  it('text an editor typed is shown exactly as typed, never rewritten', async () => {
    store.site_settings = { brand_name: 'Acme' }
    const aka = 'Wissen Haus Foundation (“Wissen-Haus”, “Wissen Haus”, “Wissen-Haus Foundation”)'
    store.page_copy_about = { heroEyebrow: aka }
    expect((await getPageCopy(ABOUT_SCHEMA)).heroEyebrow).toBe(aka)
    // ...while untouched fields on the same page still follow the brand
    expect((await getPageCopy(ABOUT_SCHEMA)).storyTitle).toBeDefined()
    store.og_meta_about = { ogTitle: 'Also known as Wissen-Haus' }
    expect((await getOgCopy(ogSchemaFor('about')!)).ogTitle).toBe('Also known as Wissen-Haus')
  })
  it('policy/wiki sections: built-in markers follow the brand, typed sections stay literal', async () => {
    store.site_settings = { brand_name: 'Acme' }
    store.policy_doc_wiki = { sections: [
      { id: 'background', isDefault: true },
      { id: 'mine', title: 'Also known as', body: 'Wissen-Haus, Wissen Haus, Wissen-Haus Foundation' },
    ] }
    const secs = await getPolicySections('wiki')
    expect(secs.map(x => x.id)).toEqual(['background', 'mine'])
    expect(secs[0].body).toContain('Acme')
    expect(secs[0].body).not.toContain('Wissen-Haus was founded')
    expect(secs[1].body).toBe('Wissen-Haus, Wissen Haus, Wissen-Haus Foundation')
  })
  it('a marker for a section that no longer exists is dropped', async () => {
    store.policy_doc_wiki = { sections: [{ id: 'gone', isDefault: true }, { id: 'x', title: 'X', body: 'y' }] }
    expect((await getPolicySections('wiki')).map(x => x.id)).toEqual(['x'])
  })
})

describe('per-page share image URL', () => {
  it('changes whenever the title, description or brand changes, and is stable otherwise', async () => {
    const schema = ogSchemaFor('about')!
    const a = (await getOgCopy(schema)).ogImage
    expect(a).toMatch(/^\/api\/og\?slug=about&v=[a-z0-9]+$/)
    expect((await getOgCopy(schema)).ogImage).toBe(a)
    store.og_meta_about = { ogTitle: 'A new share title' }
    const b = (await getOgCopy(schema)).ogImage
    expect(b).not.toBe(a)
    store.site_settings = { brand_name: 'Acme' }
    expect((await getOgCopy(schema)).ogImage).not.toBe(b)
  })
  it('leaves the homepage on the site-wide card', async () => {
    expect((await getOgCopy(ogSchemaFor('home')!)).ogImage).toBeUndefined()
  })
})
