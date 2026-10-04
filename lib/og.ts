import { getSiteContent } from './site-content'
import { brandify, brandFromSettings } from './brand'
import { ogSiteContentKeyFor, ogImageUrl, type OgPageSchema, type OgCopy } from './og-shared'

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
  // Saved text is shown exactly as typed; only built-in defaults follow the brand.
  const pick = (v: unknown, d: string) => (typeof v === 'string' && v.trim()) || brandify(d, brand)
  const out: OgCopy = {
    title: pick(saved?.title, defaults.title),
    ogTitle: pick(saved?.ogTitle, defaults.ogTitle),
    description: pick(saved?.description, defaults.description),
  }
  const { ogTitle, description } = out
  return {
    title: out.title, ogTitle, description,
    // Hashing the brand-applied text means any edit (or rename) changes the URL.
    ogImage: schema.slug === 'home' ? undefined : ogImageUrl(schema.slug, `${ogTitle}|${description}|${brand.name}|${brand.descriptor}`),
  }
}
