import { jwtVerify, type JWTPayload } from 'jose'

export const COOKIE_NAME = 'wh_token'

export interface UserPayload extends JWTPayload {
  id: string
  email: string
  name: string
  membershipExpiry?: string | null
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const { payload } = await jwtVerify(token, secret)
  return payload as UserPayload
}
