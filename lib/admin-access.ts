// Client-safe half of the admin access rules. Kept free of server imports
// (no lib/auth, no lib/db) so the admin nav -- a client component -- can ask
// the same question the route handlers ask, instead of hardcoding its own
// list and drifting out of step with them.
//
// lib/admin-guard.ts owns the server half: who is a director, and the guards
// the handlers actually enforce. This file only maps a resolved role to the
// admin paths that role may reach.

import { sectionsCoveringPath } from './admin-sections'

// `safeguarding` is the designated safeguarding team (lib/safeguarding.ts):
// people with no other admin role, who may open WHF-CIO Records and see only
// its Safeguarding tab.
//
// `trustee` is a account the master admin created for someone who is not
// otherwise staff (lib/admin-access-grants.ts). It starts with access to
// nothing and gains sections one at a time, only as granted -- unlike every
// other role here, which maps to a FIXED set of paths, a trustee's allowed
// paths vary per account, so callers must also pass the trustee's own
// granted section keys (see sectionsCoveringPath in lib/admin-sections.ts).
export type AdminRole = 'director' | 'admin' | 'editor' | 'safeguarding' | 'trustee'

// Admin sections the `editor` role may not reach. Every API route under these
// paths is userAdminGuard() or stricter, so an editor who navigated here would
// get a rendered page and a 403 behind it -- blank tables that look broken
// rather than a refusal. The nav hides them and the route layouts refuse them.
export const ADMIN_ONLY_PATHS = [
  '/admin/users',
  '/admin/whf-cio',
  '/admin/newsletter',
  '/admin/email-templates',
]

function matches(path: string, prefix: string) {
  return path === prefix || path.startsWith(prefix + '/')
}

// The AI agent reads every table, so unlike everything else its visibility is
// not a function of role at all -- it is granted per account by the master
// admin. The nav is told the answer rather than deriving it.
export const AI_AGENT_PATH = '/admin/ai'

// Everything the safeguarding team may reach. The page itself narrows them to
// the Safeguarding tab.
export const SAFEGUARDING_PATHS = ['/admin/whf-cio']
export const SAFEGUARDING_HOME = '/admin/whf-cio?tab=safeguarding'

/** Only the master admin may reach this -- it is the tool that grants every other section. */
export const ACCESS_CONTROL_PATH = '/admin/access-control'

/** Request header middleware.ts sets on /admin requests so the admin layout knows the path. */
export const PATH_HEADER = 'x-wh-pathname'

// `grantedSections` only matters for role 'trustee' -- every other role's
// access is a fixed function of the role itself, so it's fine to pass [] (or
// omit it) when calling this for anyone else.
export function canAccessAdminPath(role: AdminRole, path: string, canUseAgent = false, grantedSections: string[] = []): boolean {
  if (matches(path, ACCESS_CONTROL_PATH)) return false // isMasterAdmin() grants this separately, not through canAccessAdminPath
  if (role === 'trustee') return sectionsCoveringPath(grantedSections, path)
  if (role === 'safeguarding') return SAFEGUARDING_PATHS.some(p => matches(path, p))
  if (matches(path, AI_AGENT_PATH)) return canUseAgent
  if (role !== 'editor') return true
  return !ADMIN_ONLY_PATHS.some(p => matches(path, p))
}
