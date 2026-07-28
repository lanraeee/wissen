import { getSession, type UserPayload } from '@/lib/auth'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

export function isDirector(email?: string) {
  return email === ADMIN_EMAIL
}

export async function adminGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  const ok = isDirector(session.email) || session.role === 'admin' || session.role === 'editor'
  return ok ? session : null
}

export async function directorGuard(): Promise<UserPayload | null> {
  const session = await getSession()
  if (!session) return null
  return isDirector(session.email) ? session : null
}
