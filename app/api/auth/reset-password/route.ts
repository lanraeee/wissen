import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import sql from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendPasswordChangedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const [row] = await sql`
    SELECT id, user_id FROM password_reset_tokens
    WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > NOW()
  `
  if (!row) return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 })

  const passwordHash = await hashPassword(password)

  const [user] = await sql`
    UPDATE users SET password_hash = ${passwordHash} WHERE id = ${row.user_id}
    RETURNING email, first_name, last_name
  `

  // Marks this token used and invalidates any other outstanding ones for the user
  await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ${row.user_id} AND used_at IS NULL`

  if (user) {
    sendPasswordChangedEmail(user.email as string, `${user.first_name} ${user.last_name}`)
      .catch(err => console.error('[password changed email]', err))
  }

  return NextResponse.json({ success: true })
}
