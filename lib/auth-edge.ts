import { jwtVerify, type JWTPayload } from 'jose'

export const COOKIE_NAME = 'wh_token'

export interface UserPayload extends JWTPayload {
  id: string
  email: string
  name: string
  membershipExpiry?: string | null
}

// Resolved per call rather than at import: process.env.JWT_SECRET! quietly
// encodes the string "undefined" into a usable key when the variable is
// missing, so tokens would verify against a secret anyone could guess.
export function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET env var')
  return new TextEncoder().encode(secret)
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, jwtSecret())
  return payload as UserPayload
}
