import { getSiteContent } from '@/lib/site-content'
import { log } from '@/lib/logger'
import { ACCESS_ROLES_KEY, ACCESS_ROLES_DEFAULTS, coerceAccessRoles, type AccessRoles } from './admin-access-roles-shared'

// Falls back to "no roles" rather than throwing, same reasoning as
// getAccessGrants(): a database hiccup must degrade to less access, never to
// a broken admin area or to more access.
export async function getAccessRoles(): Promise<AccessRoles> {
  try {
    return coerceAccessRoles(await getSiteContent<AccessRoles>(ACCESS_ROLES_KEY))
  } catch (err) {
    log.warn('admin access roles', 'falling back to no roles', { error: String(err) })
    return ACCESS_ROLES_DEFAULTS
  }
}
