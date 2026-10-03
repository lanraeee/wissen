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
  it('saved copy that mentions the old name is renamed too', async () => {
    store.site_settings = { brand_name: 'Acme' }
    store.page_copy_about = { heroEyebrow: 'Hello from Wissen-Haus' }
    expect((await getPageCopy(ABOUT_SCHEMA)).heroEyebrow).toBe('Hello from Acme')
  })
})
