import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { jwtSecret } from '@/lib/auth-edge'
import { verifyViewAs, VIEW_AS_COOKIE } from '@/lib/view-as-shared'

export const COOKIE_NAME = 'wh_token'

export interface UserPayload extends JWTPayload {
  id: string
  email: string
  name: string
  role?: string
  membershipExpiry?: string | null
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12)
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash)
}

export async function signToken(payload: UserPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(jwtSecret())
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, jwtSecret())
  return payload as UserPayload
}

export async function getSession(): Promise<UserPayload | null> {
  const jar = await cookies()
  // A live "view as member" session takes precedence for the page being
  // viewed. The admin's own cookie is left alone, so exiting restores it.
  const view = await verifyViewAs(jar.get(VIEW_AS_COOKIE)?.value)
  if (view) {
    return {
      id: view.id, email: view.email, name: view.name, role: view.role,
      membershipExpiry: view.membershipExpiry, viewer: view.viewer,
    }
  }
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}
