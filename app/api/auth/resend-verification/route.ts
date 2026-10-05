import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { createEmailVerificationUrl } from '@/lib/email-verification'
import { runAfterResponse } from '@/lib/background'
import { parseBody, zEmail } from '@/lib/validation'
import { log } from '@/lib/logger'

const ResendSchema = z.object({ email: zEmail })

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ResendSchema)
  if (error) return error

  // Same answer whether or not there is a pending account for this address,
  // so the endpoint can't be used to find out who has signed up.
  try {
    const [user] = await sql`
      SELECT id, email, first_name, last_name FROM users
      WHERE email = ${data.email.toLowerCase().trim()} AND email_verified_at IS NULL
    `
    if (user) {
      const verifyUrl = await createEmailVerificationUrl(user.id as string)
      runAfterResponse(() =>
        sendVerificationEmail(user.email as string, `${user.first_name} ${user.last_name}`, verifyUrl)
          .catch(err => log.error('verification email', err))
      )
    }
  } catch (err) {
    log.error('resend-verification', err)
  }

  return NextResponse.json({ success: true })
}
