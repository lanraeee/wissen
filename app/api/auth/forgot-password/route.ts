import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { runAfterResponse } from '@/lib/background'
import { createPasswordResetUrl } from '@/lib/password-reset'
import { parseBody, zEmail } from '@/lib/validation'
import { log } from '@/lib/logger'

const ForgotPasswordSchema = z.object({ email: zEmail })

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ForgotPasswordSchema)
  if (error) return error
  const { email } = data

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  try {
    const [user] = await sql`SELECT id, first_name, last_name FROM users WHERE email = ${email.toLowerCase().trim()}`
    if (user) {
      const resetUrl = await createPasswordResetUrl(user.id as string)
      const name = `${user.first_name} ${user.last_name}`

      runAfterResponse(() => sendPasswordResetEmail(email, name, resetUrl).catch(err => log.error('password reset email', err)))
    }
  } catch (err) {
    log.error('forgot-password', err)
  }

  return NextResponse.json({ success: true })
}
