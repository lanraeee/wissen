import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email'
import { consumeEmailVerificationToken } from '@/lib/email-verification'
import { runAfterResponse } from '@/lib/background'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'

const VerifyEmailSchema = z.object({ token: z.string().min(1).max(500) })

// A POST from the /verify-email page rather than a GET on the emailed link
// itself, so mail scanners that prefetch links can't spend the token.
export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, VerifyEmailSchema)
  if (error) return error

  try {
    const user = await consumeEmailVerificationToken(data.token)
    if (!user) {
      return NextResponse.json({ error: 'This confirmation link is invalid, has expired or was already used.' }, { status: 400 })
    }

    if (user.newlyVerified) {
      const name = `${user.firstName} ${user.lastName}`
      runAfterResponse(() => sendWelcomeEmail(user.email, name).catch(e => log.error('welcome email', e)))
    }

    return NextResponse.json({ success: true, email: user.email })
  } catch (err) {
    log.error('verify-email', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
