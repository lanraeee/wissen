import { getSession, type UserPayload } from '@/lib/auth'
import type { AdminRole } from '@/lib/admin-access'
import { isSafeguardingTeam } from '@/lib/safeguarding'

const PRIMARY_DIRECTOR_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

// List of director emails with full admin access
const DIRECTOR_EMAILS = [
  PRIMARY_DIRECTOR_EMAIL,
  'wissenhaus@outlook.com',
]

export function isDirector(email?: string) {
  return email ? DIRECTOR_EMAILS.includes(email) : false
}

// The Wissen-Haus Ltd (UK) master admin account. Protected from deletion
// entirely -- including by the other director -- so there is never a path,
// accidental or otherwise, to delete the organisation's own top-level account.
export const MASTER_ADMIN_EMAIL = 'wissenhaus@outlook.com'

export function isMasterAdmin(email?: string) {
  return email === MASTER_ADMIN_EMAIL
}

export async function adminGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  const ok = isDirector(session.email) || session.role === 'admin' || session.role === 'editor'
  return ok ? session : null
}

// Staff who may manage user accounts. Deliberately excludes `editor`, which
// adminGuard() admits: editors are content contributors, and user records carry
// both PII and the email address that isDirector() derives identity from.
export async function userAdminGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  const ok = isDirector(session.email) || session.role === 'admin'
  return ok ? session : null
}

export async function directorGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  return isDirector(session.email) ? session : null
}

// The single place a session becomes a role name. Everything that renders
// differently per role -- the nav, the route layouts, the director-only tabs --
// resolves through this rather than re-deriving "is this a director" from an
// email comparison of its own, which is how app/admin/layout.tsx and the cron
// route ended up disagreeing with isDirector() about wissenhaus@outlook.com.
export async function adminRole(): Promise<AdminRole | null> {
  const session = await getSession()
  if (!session) return null
  if (isDirector(session.email)) return 'director'
  if (session.role === 'admin') return 'admin'
  if (session.role === 'editor') return 'editor'
  if (await isSafeguardingTeam(session.email)) return 'safeguarding'
  return null
}

// The WHF-CIO Safeguarding tab (the incident log): directors and the
// designated safeguarding team only. Not admins or editors -- the
// safeguarding policy promises reports are read by the safeguarding lead, not
// by general staff. Note this is not a superset of adminGuard(): an admin who
// is not on the team is refused.
export async function canAccessSafeguarding(email?: string): Promise<boolean> {
  return isDirector(email) || await isSafeguardingTeam(email)
}

export async function safeguardingGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  return (await canAccessSafeguarding(session.email)) ? session : null
}
