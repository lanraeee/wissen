import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { parseBody } from '@/lib/validation'
import { log } from '@/lib/logger'
import { clientIp } from '@/lib/rate-limit'
import { recordVisit } from '@/lib/streak'

const LoginSchema = z.object({
  email: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, LoginSchema)
    if (error) return error
    const { email, password } = data

    const [user] = await sql`
      SELECT id, email, password_hash, first_name, last_name, membership_expiry, role
      FROM users WHERE email = ${email.toLowerCase()}
    `
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role ?? 'user',
      membershipExpiry: user.membership_expiry,
    })

    await recordVisit(user.id)

    // Session history shown in the user's admin activity view. Best-effort --
    // not awaited alongside the response, a logging hiccup shouldn't delay login.
    sql`
      INSERT INTO login_events (user_id, ip, user_agent)
      VALUES (${user.id}, ${clientIp(req)}, ${req.headers.get('user-agent') ?? null})
    `.catch(err => log.error('login event', err))

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` }
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (err) {
    log.error('login', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
