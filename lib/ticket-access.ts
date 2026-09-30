import { SignJWT, jwtVerify } from 'jose'
import { jwtSecret } from '@/lib/auth-edge'

// Access to a support conversation used to be the reference alone: hold the
// code, read the thread. That made the code a bearer credential, so anything
// that leaked it -- a screenshot, a shared browser, a forwarded email -- handed
// over the whole conversation, and there was no way to take it back.
//
// Access is now bound to the visitor instead, through one of three proofs:
//
//   1. a signed-in account whose id matches the ticket's user_id;
//   2. this access token, issued to the browser that opened the ticket and to
//      anyone who proves control of the ticket's email address;
//   3. a fresh magic link, which is how (2) is obtained after the fact.
//
// The reference stays the identifier -- it is what a visitor quotes to us and
// what appears in email subject lines -- but on its own it no longer opens
// anything.
const TICKET_TOKEN_COOKIE = 'wh_ticket'
const TOKEN_TTL = '90d'
// A magic link is emailed, and email sits in an inbox for a long time. Keep
// the window in which a forwarded one still works short.
const MAGIC_TTL = '30m'

export { TICKET_TOKEN_COOKIE }

type TicketClaims = { tid: string; ref: string; kind: 'access' | 'magic' }

async function mint(claims: TicketClaims, ttl: string): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(jwtSecret())
}

export function mintAccessToken(ticketId: string, reference: string) {
  return mint({ tid: ticketId, ref: reference, kind: 'access' }, TOKEN_TTL)
}

export function mintMagicToken(ticketId: string, reference: string) {
  return mint({ tid: ticketId, ref: reference, kind: 'magic' }, MAGIC_TTL)
}

// Returns the ticket id the token is good for, or null. Verifies the signature
// rather than trusting the payload, and checks the reference matches the one
// being requested so a token for ticket A cannot be replayed against ticket B.
export async function ticketFromToken(
  token: string | undefined,
  reference: string,
  kind: 'access' | 'magic',
): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, jwtSecret())
    const claims = payload as unknown as TicketClaims
    if (claims.kind !== kind) return null
    if (claims.ref !== reference) return null
    return claims.tid ?? null
  } catch {
    return null
  }
}
