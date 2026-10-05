// Client-safe half of the admin access rules. Kept free of server imports
// (no lib/auth, no lib/db) so the admin nav -- a client component -- can ask
// the same question the route handlers ask, instead of hardcoding its own
// list and drifting out of step with them.
//
// lib/admin-guard.ts owns the server half: who is a director, and the guards
// the handlers actually enforce. This file only maps a resolved role to the
// admin paths that role may reach.

// `safeguarding` is the designated safeguarding team (lib/safeguarding.ts):
// people with no other admin role, who may open WHF-CIO Records and see only
// its Safeguarding tab.
export type AdminRole = 'director' | 'admin' | 'editor' | 'safeguarding'

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

/** Request header middleware.ts sets on /admin requests so the admin layout knows the path. */
export const PATH_HEADER = 'x-wh-pathname'

export function canAccessAdminPath(role: AdminRole, path: string, canUseAgent = false): boolean {
  if (role === 'safeguarding') return SAFEGUARDING_PATHS.some(p => matches(path, p))
  if (matches(path, AI_AGENT_PATH)) return canUseAgent
  if (role !== 'editor') return true
  return !ADMIN_ONLY_PATHS.some(p => matches(path, p))
}
