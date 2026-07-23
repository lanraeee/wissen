import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const [user] = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName})
      RETURNING id, email, first_name, last_name, membership_expiry
    `

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      membershipExpiry: user.membership_expiry,
    })

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email as string, `${user.first_name} ${user.last_name}`).catch(e => console.error('[welcome email]', e))

    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` } })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
