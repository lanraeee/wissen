import { unstable_cache as cache } from 'next/cache'
import sql from './db'

export function siteContentTag(key: string) {
  return `site-content:${key}`
}

/**
 * Cached read of a site_content JSON value, invalidated by the admin
 * content PUT route calling revalidateTag(siteContentTag(key)) after a
 * write. Lets pages stay statically cached instead of force-dynamic while
 * still reflecting admin edits immediately (rather than after the next
 * deploy or an arbitrary time-based revalidation window).
 */
async function readSiteContent<T>(key: string): Promise<T | null> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = ${key}`
    return (rows[0]?.value as T) ?? null
  } catch {
    return null
  }
}

export async function getSiteContent<T>(key: string): Promise<T | null> {
  try {
    return await cache(
      () => readSiteContent<T>(key),
      ['site-content', key],
      { tags: [siteContentTag(key)] }
    )()
  } catch {
    // unstable_cache requires the Next.js incremental cache context, which
    // isn't present outside an actual request (unit tests, scripts run
    // outside next start/dev). Fall back to an uncached read there instead
    // of letting every caller of getSiteContent crash.
    return readSiteContent<T>(key)
  }
}
