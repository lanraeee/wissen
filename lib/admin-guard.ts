import { getSession, type UserPayload } from '@/lib/auth'
import type { AdminRole } from '@/lib/admin-access'
import { isSafeguardingTeam } from '@/lib/safeguarding'
import { getGrantedSections } from '@/lib/admin-access-grants'
import sql from '@/lib/db'

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

export async function masterAdminGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  return isMasterAdmin(session.email) ? session : null
}

// Trustee accounts (role 'trustee') start with zero access to everything,
// and gain it one section at a time, only as the master admin grants it
// (lib/admin-access-grants.ts, managed from the Access Control page). This
// is the per-route equivalent of adminGuard()/directorGuard() for that
// model: pass it the section key the route serves (see lib/admin-sections.ts)
// and it admits a director, the master admin, or anyone granted that exact
// section -- never a bare 'admin'/'editor' role, which has no bearing on
// trustee grants at all.
export async function sectionGuard(sectionKey: string): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  if (isDirector(session.email) || isMasterAdmin(session.email)) return session
  const granted = await getGrantedSections(session.email)
  return granted.includes(sectionKey) ? session : null
}

// Guards the shared WHF-CIO documents API (app/api/admin/whf-cio/documents/**),
// which every tab's DocumentsPanel calls through with its own linked_type
// (e.g. "meetings", "trustee_declarations"). A request scoped to one
// linked_type needs that tab's own grant -- the same one that would let a
// trustee into the tab itself -- not a separate "documents" permission. An
// unfiltered request (the standalone Documents tab, which lists everything
// regardless of tab) stays director/master-admin only: a trustee seeing that
// could see attachments from tabs they were never granted.
export async function documentsGuard(linkedType: string | null): Promise<UserPayload | null> {
  if (linkedType) return sectionGuard(`whf_cio.${linkedType}`)
  const session = await getSession()
  if (!session) return null
  return (isDirector(session.email) || isMasterAdmin(session.email)) ? session : null
}

// Same question as documentsGuard(), for routes that only have the
// document's id (PUT/DELETE/download/backup) -- looks up its linked_type
// first, then asks the same question.
export async function documentByIdGuard(id: string): Promise<UserPayload | null> {
  const rows = await sql`SELECT linked_type FROM cio_documents WHERE id = ${id}`
  if (!rows.length) return null
  return documentsGuard(rows[0].linked_type as string | null)
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
  if (session.role === 'trustee') return 'trustee'
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
