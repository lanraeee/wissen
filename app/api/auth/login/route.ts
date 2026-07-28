import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

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

    // update streak
    await sql`
      INSERT INTO visit_streaks (user_id, streak_count, last_visit)
      VALUES (${user.id}, 1, CURRENT_DATE)
      ON CONFLICT (user_id) DO UPDATE SET
        streak_count = CASE
          WHEN visit_streaks.last_visit = CURRENT_DATE THEN visit_streaks.streak_count
          WHEN visit_streaks.last_visit = CURRENT_DATE - INTERVAL '1 day' THEN visit_streaks.streak_count + 1
          ELSE 1
        END,
        last_visit = CURRENT_DATE,
        updated_at = NOW()
    `

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
    console.error('[login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
