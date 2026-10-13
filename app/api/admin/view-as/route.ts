import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import sql from '@/lib/db'
import { userAdminGuard, isDirector, isMasterAdmin, isBlockedAdmin } from '@/lib/admin-guard'
import { verifyPassword } from '@/lib/auth'
import { parseBody } from '@/lib/validation'
import { logActivityRequired } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import {
  VIEW_AS_COOKIE, VIEW_AS_META_COOKIE, VIEW_AS_MIN_REASON_LENGTH, VIEW_AS_TTL_SECONDS,
  signViewAs, verifyViewAs, viewAsMetaValue, viewAsRefusal,
} from '@/lib/view-as-shared'

const StartSchema = z.object({
  userId: z.string().uuid(),
  // Required for everyone except the master admin, checked below.
  reason: z.string().trim().max(500).default(''),
  // Re-entered on purpose: a stolen or left-open admin session must not be
  // enough to read a member's account.
  password: z.string().min(1).max(200),
})

// Opens a read-only, time-limited view of a member's account for support.
// Admitted: the director and admin role only (userAdminGuard). Editors and
// trustees are refused, and staff or protected accounts can never be the target.
export async function POST(req: NextRequest) {
  const session = await userAdminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // One view at a time. Stacking views would make it unclear whose account
  // a request is acting on.
  if (await verifyViewAs((await cookies()).get(VIEW_AS_COOKIE)?.value)) {
    return NextResponse.json({ error: 'You are already viewing a member account. Exit that view first.' }, { status: 409 })
  }

  const { data, error } = await parseBody(req, StartSchema)
  if (error) return error

  // The master admin is not asked for a reason and their views are not logged.
  const master = isMasterAdmin(session.email)
  if (!master && data.reason.length < VIEW_AS_MIN_REASON_LENGTH) {
    return NextResponse.json(
      { error: `Say why you need to view this account (at least ${VIEW_AS_MIN_REASON_LENGTH} characters).` },
      { status: 400 },
    )
  }

  const [me] = await sql`SELECT password_hash FROM users WHERE id = ${session.id}`
  if (!me || !(await verifyPassword(data.password, me.password_hash as string))) {
    return NextResponse.json({ error: 'Your password was not accepted.' }, { status: 403 })
  }

  const [target] = await sql`
    SELECT id, email, first_name, last_name, role, membership_expiry FROM users WHERE id = ${data.userId}
  `
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const refusal = viewAsRefusal(session.id as string, {
    id: target.id as string,
    role: target.role as string,
    protected: isDirector(target.email as string) || isMasterAdmin(target.email as string) || isBlockedAdmin(target.email as string),
  })
  if (refusal) return NextResponse.json({ error: refusal }, { status: 403 })

  const name = `${target.first_name} ${target.last_name}`
  const expiresAt = new Date(Date.now() + VIEW_AS_TTL_SECONDS * 1000)

  // Audit first, and fail closed: if the record cannot be written, the view
  // does not start. Throws to the outer catch below. The master admin's views
  // are not written to the activity log.
  if (!master) {
    try {
      await logActivityRequired(
        { id: session.id as string, email: session.email, role: session.role },
        'user.view_as.start',
        { targetType: 'user', targetId: target.id as string, details: { reason: data.reason, expires_at: expiresAt.toISOString() } },
      )
    } catch (err) {
      log.error('view-as', err, { viewerId: session.id })
      return NextResponse.json({ error: 'Could not record the view, so it was not started. Try again.' }, { status: 500 })
    }
  }

  const token = await signViewAs({
    id: target.id as string,
    email: target.email as string,
    name,
    role: 'user',
    membershipExpiry: target.membership_expiry ? new Date(target.membership_expiry as string).toISOString() : null,
    viewer: { id: session.id as string, email: session.email, role: (session.role as string) ?? 'admin' },
  })

  const res = NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() })
  const common = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: VIEW_AS_TTL_SECONDS,
    path: '/',
  }
  res.cookies.set(VIEW_AS_COOKIE, token, { ...common, httpOnly: true })
  // Not httpOnly: the banner reads it. It grants nothing.
  res.cookies.set(VIEW_AS_META_COOKIE, viewAsMetaValue(name, expiresAt), { ...common, httpOnly: false })
  return res
}
