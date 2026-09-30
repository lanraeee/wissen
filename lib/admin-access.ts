// Client-safe half of the admin access rules. Kept free of server imports
// (no lib/auth, no lib/db) so the admin nav -- a client component -- can ask
// the same question the route handlers ask, instead of hardcoding its own
// list and drifting out of step with them.
//
// lib/admin-guard.ts owns the server half: who is a director, and the guards
// the handlers actually enforce. This file only maps a resolved role to the
// admin paths that role may reach.

export type AdminRole = 'director' | 'admin' | 'editor'

// Admin sections the `editor` role may not reach. Every API route under these
// paths is userAdminGuard() or stricter, so an editor who navigated here would
// get a rendered page and a 403 behind it -- blank tables that look broken
// rather than a refusal. The nav hides them and the route layouts refuse them.
export const ADMIN_ONLY_PATHS = [
  '/admin/users',
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

export function canAccessAdminPath(role: AdminRole, path: string, canUseAgent = false): boolean {
  if (matches(path, AI_AGENT_PATH)) return canUseAgent
  if (role !== 'editor') return true
  return !ADMIN_ONLY_PATHS.some(p => matches(path, p))
}
