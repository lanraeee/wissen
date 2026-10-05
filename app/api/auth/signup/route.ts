import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { createEmailVerificationUrl } from '@/lib/email-verification'
import { runAfterResponse } from '@/lib/background'
import { parseBody, zEmail, zName } from '@/lib/validation'
import { log } from '@/lib/logger'

const SignupSchema = z.object({
  firstName: zName,
  lastName: zName,
  email: zEmail,
  password: z.string().min(8).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, SignupSchema)
    if (error) return error
    const { firstName, lastName, email, password } = data

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // No session yet: the account stays unusable until its owner clicks the
    // emailed link, so registering someone else's address gets you nothing.
    const passwordHash = await hashPassword(password)
    const [user] = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, email_verified_at)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, NULL)
      RETURNING id, email, first_name, last_name
    `

    const verifyUrl = await createEmailVerificationUrl(user.id as string)
    runAfterResponse(() =>
      sendVerificationEmail(user.email as string, `${user.first_name} ${user.last_name}`, verifyUrl)
        .catch(e => log.error('verification email', e))
    )

    return NextResponse.json({
      success: true,
      verificationRequired: true,
      user: { id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` },
    })
  } catch (err) {
    log.error('signup', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
