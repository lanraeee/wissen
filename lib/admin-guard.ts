import { getSession, type UserPayload } from '@/lib/auth'

const PRIMARY_DIRECTOR_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

// List of director emails with full admin access
const DIRECTOR_EMAILS = [
  PRIMARY_DIRECTOR_EMAIL,
  'wissenhaus@outlook.com',
]

export function isDirector(email?: string) {
  return email ? DIRECTOR_EMAILS.includes(email) : false
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
