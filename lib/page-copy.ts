import { getSiteContent } from './site-content'
import { brandify, brandFromSettings } from './brand'
import { siteContentKeyFor, type PageCopySchema } from './page-copy-shared'

export * from './page-copy-shared'

/**
 * Reads the saved copy for one page, backfilling any field that was never
 * saved (or was saved as something other than a non-empty string) with the
 * schema's default. Always returns every field as a plain string -- callers
 * never need an `?? fallback` at the call site.
 */
export async function getPageCopy(schema: PageCopySchema): Promise<Record<string, string>> {
  const [saved, settings] = await Promise.all([
    getSiteContent<Record<string, unknown>>(siteContentKeyFor(schema.slug)),
    getSiteContent<unknown>('site_settings'),
  ])
  const brand = brandFromSettings(settings)
  const out: Record<string, string> = {}
  for (const field of schema.fields) {
    const v = saved?.[field.key]
    out[field.key] = brandify(typeof v === 'string' && v.trim() ? v : field.default, brand)
  }
  return out
}
