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
export function getSiteContent<T>(key: string) {
  return cache(
    async (): Promise<T | null> => {
      try {
        const rows = await sql`SELECT value FROM site_content WHERE key = ${key}`
        return (rows[0]?.value as T) ?? null
      } catch {
        return null
      }
    },
    ['site-content', key],
    { tags: [siteContentTag(key)] }
  )()
}
