import { getSiteContent } from '@/lib/site-content'
import { log } from '@/lib/logger'
import { ACCESS_GRANTS_KEY, ACCESS_GRANTS_DEFAULTS, coerceAccessGrants, type AccessGrants, type AccessLevel } from './admin-access-grants-shared'
import { effectiveLevels } from './admin-access-roles-shared'
import { getAccessRoles } from './admin-access-roles'

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

async function levelsFor(email: string): Promise<Record<string, { level: AccessLevel }>> {
  const [grants, roles] = await Promise.all([getAccessGrants(), getAccessRoles()])
  return effectiveLevels(email, grants, roles)
}

/** Every section key this email has any level of access to (direct or via an assigned role) -- for nav/path visibility, which doesn't distinguish levels. */
export async function getGrantedSections(email: string | undefined): Promise<string[]> {
  if (!email) return []
  return Object.keys(await levelsFor(email))
}

/** This email's effective access level for one section, or null if ungranted. */
export async function getSectionLevel(email: string | undefined, sectionKey: string): Promise<AccessLevel | null> {
  if (!email) return null
  return (await levelsFor(email))[sectionKey]?.level ?? null
}
