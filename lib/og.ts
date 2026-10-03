import { getSiteContent } from './site-content'
import { brandify, brandFromSettings } from './brand'
import { ogSiteContentKeyFor, type OgPageSchema, type OgCopy } from './og-shared'

export * from './og-shared'

/**
 * Reads the saved Open Graph / meta copy for one page, falling back
 * field-by-field to the schema's defaults (or, if given, `overrideDefaults`
 * -- used by pages whose "default" is itself computed live, e.g. the
 * homepage's title tracking the site tagline). A saved admin override
 * always wins when non-empty; an empty/whitespace field is treated as
 * "not customized" and falls through to the default.
 */
export async function getOgCopy(schema: OgPageSchema, overrideDefaults?: Partial<OgCopy>): Promise<OgCopy> {
  const defaults: OgCopy = {
    title: overrideDefaults?.title ?? schema.defaultTitle,
    ogTitle: overrideDefaults?.ogTitle ?? schema.defaultOgTitle,
    description: overrideDefaults?.description ?? schema.defaultDescription,
  }
  const [saved, settings] = await Promise.all([
    getSiteContent<Partial<OgCopy>>(ogSiteContentKeyFor(schema.slug)),
    getSiteContent<unknown>('site_settings'),
  ])
  const brand = brandFromSettings(settings)
  const out: OgCopy = {
    title: (typeof saved?.title === 'string' && saved.title.trim()) || defaults.title,
    ogTitle: (typeof saved?.ogTitle === 'string' && saved.ogTitle.trim()) || defaults.ogTitle,
    description: (typeof saved?.description === 'string' && saved.description.trim()) || defaults.description,
  }
  return { title: brandify(out.title, brand), ogTitle: brandify(out.ogTitle, brand), description: brandify(out.description, brand) }
}
