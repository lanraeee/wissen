import { getSession, type UserPayload } from '@/lib/auth'
import type { AdminRole } from '@/lib/admin-access'
import { isSafeguardingTeam } from '@/lib/safeguarding'
import { getSectionLevel, getGrantedSections, type AccessLevel } from '@/lib/admin-access-grants'
import sql from '@/lib/db'

// The Wissen-Haus Ltd (UK) master admin account: the one account with total
// control, and the only director. Protected from deletion entirely so there is
// never a path, accidental or otherwise, to delete the organisation's own
// top-level account.
export const MASTER_ADMIN_EMAIL = 'wissenhaus@outlook.com'

// Accounts that must never hold any admin access, whatever their stored role
// or grants say. director@wissenhaus.org used to be a second director; the
// master admin withdrew that. Enforced here (not just by demoting the row)
// so a leftover 'admin' role or grant can never bring it back.
const BLOCKED_ADMIN_EMAILS = ['director@wissenhaus.org']

function norm(email?: string) {
  return email?.trim().toLowerCase() ?? ''
}

export function isBlockedAdmin(email?: string) {
  return BLOCKED_ADMIN_EMAILS.includes(norm(email))
}

export function isMasterAdmin(email?: string) {
  return norm(email) === MASTER_ADMIN_EMAIL
}

// "Director" and "master admin" are now the same single account; the name
// stays because every director-only guard and UI branch keys off it.
export function isDirector(email?: string) {
  return isMasterAdmin(email)
}

const PRIVILEGED_ROLES = new Set(['admin', 'editor', 'trustee'])

// The session cookie is a 30-day JWT carrying the role it was issued with, so
// demoting or deleting an account would otherwise change nothing until that
// token expired. For privileged roles the role is re-read from the database on
// every admin request; admin traffic is low, and ordinary members never pay
// for this. A failed lookup refuses rather than trusting a possibly-revoked
// token.
async function getLiveSession(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  if (isBlockedAdmin(session.email)) return null
  if (isMasterAdmin(session.email) || !session.role || !PRIVILEGED_ROLES.has(session.role)) return session
  try {
    const rows = await sql`SELECT role FROM users WHERE id = ${session.id}`
    if (!rows.length) return null
    return { ...session, role: rows[0].role as string }
  } catch {
    return null
  }
}

export async function adminGuard(): Promise<UserPayload | null> {
  const session = await getLiveSession()
  if (!session) return null
  const ok = isDirector(session.email) || session.role === 'admin' || session.role === 'editor'
  return ok ? session : null
}

// Staff who may manage user accounts. Deliberately excludes `editor`, which
// adminGuard() admits: editors are content contributors, and user records carry
// both PII and the email address that isDirector() derives identity from.
export async function userAdminGuard(): Promise<UserPayload | null> {
  const session = await getLiveSession()
  if (!session) return null
  const ok = isDirector(session.email) || session.role === 'admin'
  return ok ? session : null
}

export async function directorGuard(): Promise<UserPayload | null> {
  const session = await getLiveSession()
  if (!session) return null
  return isDirector(session.email) ? session : null
}

export async function masterAdminGuard(): Promise<UserPayload | null> {
  const session = await getLiveSession()
  if (!session) return null
  return isMasterAdmin(session.email) ? session : null
}

// Trustee accounts (role 'trustee') start with zero access to everything,
// and gain it one section at a time, only as the master admin grants it
// (lib/admin-access-grants.ts, managed from the Access Control page), at
// one of two levels: 'read' or 'write' (which implies read -- there is no
// write-only grant). These are the per-route equivalent of
// adminGuard()/directorGuard() for that model: pass the section key the
// route serves (see lib/admin-sections.ts). Both admit the master admin
// unconditionally and otherwise only a live 'trustee' account holding the
// grant -- never a bare 'admin'/'editor' role (which has no bearing on trustee
// grants, and which the nav would not show the section to either), and never
// a demoted account whose grants merely haven't been cleaned up yet.
//
// sectionGuard() is for GET/read routes: a 'read' or 'write' grant both
// pass. sectionWriteGuard() is for anything that mutates data (POST, PUT,
// PATCH, DELETE): only a 'write' grant passes -- a trustee granted
// read-only access to a section can open it and see everything in it, but
// every save/create/delete call in that section must use this instead.
export async function sectionGuard(sectionKey: string): Promise<UserPayload | null> {
  const session = await getLiveSession()
  if (!session) return null
  if (isMasterAdmin(session.email)) return session
  if (session.role !== 'trustee') return null
  const level = await getSectionLevel(session.email, sectionKey)
  return level ? session : null
}

export async function sectionWriteGuard(sectionKey: string): Promise<UserPayload | null> {
  const session = await getLiveSession()
  if (!session) return null
  if (isMasterAdmin(session.email)) return session
  if (session.role !== 'trustee') return null
  const level = await getSectionLevel(session.email, sectionKey)
  return level === 'write' ? session : null
}

// For read-only aggregate endpoints (nav badges) that serve several sections
// at once: returns the live trustee session plus every section key it holds,
// so the handler can include only the parts that account may see.
export async function trusteeSectionsGuard(): Promise<{ session: UserPayload; sections: string[] } | null> {
  const session = await getLiveSession()
  if (!session || session.role !== 'trustee') return null
  const sections = await getGrantedSections(session.email)
  return sections.length ? { session, sections } : null
}

// Guards the shared WHF-CIO documents API (app/api/admin/whf-cio/documents/**),
// which every tab's DocumentsPanel calls through with its own linked_type
// (e.g. "meetings", "trustee_declarations"). A request scoped to one
// linked_type needs that tab's own grant, at the given level -- the same
// grant that would let a trustee into the tab itself, not a separate
// "documents" permission. An unfiltered request (the standalone Documents
// tab, which lists everything regardless of tab) stays director/master-admin
// only: a trustee seeing that could see attachments from tabs they were
// never granted.
export async function documentsGuard(linkedType: string | null, level: AccessLevel): Promise<UserPayload | null> {
  if (linkedType) return level === 'write' ? sectionWriteGuard(`whf_cio.${linkedType}`) : sectionGuard(`whf_cio.${linkedType}`)
  const session = await getLiveSession()
  if (!session) return null
  return (isDirector(session.email) || isMasterAdmin(session.email)) ? session : null
}

// Same question as documentsGuard(), for routes that only have the
// document's id (PUT/DELETE/download/backup) -- looks up its linked_type
// first, then asks the same question at the given level.
export async function documentByIdGuard(id: string, level: AccessLevel): Promise<UserPayload | null> {
  const rows = await sql`SELECT linked_type FROM cio_documents WHERE id = ${id}`
  if (!rows.length) return null
  return documentsGuard(rows[0].linked_type as string | null, level)
}

// The single place a session becomes a role name. Everything that renders
// differently per role -- the nav, the route layouts, the director-only tabs --
// resolves through this rather than re-deriving "is this a director" from an
// email comparison of its own, which is how app/admin/layout.tsx and the cron
// route ended up disagreeing with isDirector() about wissenhaus@outlook.com.
export async function adminRole(): Promise<AdminRole | null> {
  const session = await getLiveSession()
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
  const session = await getLiveSession()
  if (!session) return null
  return (await canAccessSafeguarding(session.email)) ? session : null
}
