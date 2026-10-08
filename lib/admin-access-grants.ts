import { getSiteContent } from '@/lib/site-content'
import { log } from '@/lib/logger'
import { ACCESS_GRANTS_KEY, ACCESS_GRANTS_DEFAULTS, coerceAccessGrants, type AccessGrants, type AccessLevel } from './admin-access-grants-shared'

export { ACCESS_GRANTS_KEY }
export type { AccessLevel }

// Read directly (not cached beyond getSiteContent's own caching) so a grant
// or revoke takes effect on the next request, same reasoning as
// lib/ai-settings.ts's getAiSettings(): this must not fail the whole admin
// area if the database hiccups, so it falls back to "nobody has anything
// granted" rather than throwing.
export async function getAccessGrants(): Promise<AccessGrants> {
  try {
    const raw = await getSiteContent<AccessGrants>(ACCESS_GRANTS_KEY)
    return coerceAccessGrants(raw)
  } catch (err) {
    log.warn('admin access grants', 'falling back to no grants', { error: String(err) })
    return ACCESS_GRANTS_DEFAULTS
  }
}

/** Every section key this email has any level of access to (read or write) -- for nav/path visibility, which doesn't distinguish levels. */
export async function getGrantedSections(email: string | undefined): Promise<string[]> {
  if (!email) return []
  const { grants } = await getAccessGrants()
  return Object.keys(grants[email.trim().toLowerCase()] ?? {})
}

/** This email's access level for one section, or null if ungranted. */
export async function getSectionLevel(email: string | undefined, sectionKey: string): Promise<AccessLevel | null> {
  if (!email) return null
  const { grants } = await getAccessGrants()
  return grants[email.trim().toLowerCase()]?.[sectionKey] ?? null
}
