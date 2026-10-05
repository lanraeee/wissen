import crypto from 'crypto'
import sql from '@/lib/db'

/** How long a confirmation link stays valid. */
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

export function hashVerificationToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Creates a fresh single-use confirmation token for a user and returns the
 * link to email them. Only the SHA-256 of the token is stored, so a leaked
 * table cannot be turned into working links.
 */
export async function createEmailVerificationUrl(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS)

  await sql`
    INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashVerificationToken(token)}, ${expiresAt.toISOString()})
  `

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  return `${siteUrl}/verify-email?token=${token}`
}

export interface VerifiedUser {
  email: string
  firstName: string
  lastName: string
  /** False when the address was already confirmed before this link was used. */
  newlyVerified: boolean
}

/**
 * Spends a confirmation token and marks its user's email as verified.
 * Returns null when the token is unknown, expired or already used. Claiming
 * the token is a single UPDATE so two clicks on the same link cannot both
 * succeed.
 */
export async function consumeEmailVerificationToken(token: string): Promise<VerifiedUser | null> {
  const [claimed] = await sql`
    UPDATE email_verification_tokens SET used_at = NOW()
    WHERE token_hash = ${hashVerificationToken(token)} AND used_at IS NULL AND expires_at > NOW()
    RETURNING user_id
  `
  if (!claimed) return null

  // The CTE reads the row as it was before the UPDATE, which is how this
  // tells a first confirmation (send the welcome email) from a repeat.
  const [user] = await sql`
    WITH prev AS (SELECT id, email_verified_at FROM users WHERE id = ${claimed.user_id})
    UPDATE users u SET email_verified_at = COALESCE(u.email_verified_at, NOW())
    FROM prev WHERE u.id = prev.id
    RETURNING u.email, u.first_name, u.last_name, prev.email_verified_at IS NULL AS newly_verified
  `
  if (!user) return null

  // Any other links still sitting in the inbox are now pointless.
  await sql`UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = ${claimed.user_id} AND used_at IS NULL`

  return {
    email: user.email as string,
    firstName: user.first_name as string,
    lastName: user.last_name as string,
    newlyVerified: !!user.newly_verified,
  }
}
