import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import sql from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { parseBody, zEmail } from '@/lib/validation'
import { log } from '@/lib/logger'

const ForgotPasswordSchema = z.object({ email: zEmail })

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ForgotPasswordSchema)
  if (error) return error
  const { email } = data

  await ensureTable()

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  try {
    const [user] = await sql`SELECT id, first_name, last_name FROM users WHERE email = ${email.toLowerCase().trim()}`
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
      `

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
      const resetUrl = `${siteUrl}/reset-password?token=${token}`
      const name = `${user.first_name} ${user.last_name}`

      sendPasswordResetEmail(email, name, resetUrl).catch(err => log.error('password reset email', err))
    }
  } catch (err) {
    log.error('forgot-password', err)
  }

  return NextResponse.json({ success: true })
}
