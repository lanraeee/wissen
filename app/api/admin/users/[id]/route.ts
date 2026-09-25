import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard, isDirector } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody, zEmail } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('grant_premium') }),
  z.object({ action: z.literal('revoke_premium') }),
  z.object({
    action: z.literal('update'),
    first_name: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().min(1).max(100).optional(),
    email: zEmail.optional(),
    // From a date input (YYYY-MM-DD) — refined below rather than at the
    // field level so the error message can name the actual problem.
    created_at: z.string().max(30).optional(),
  }),
  z.object({ action: z.literal('set_role'), role: z.string() }),
])

// The director is identified by email address (isDirector) and users.email is
// UNIQUE, so whoever can rewrite email addresses can take over the
// directorship: move the founder address off the director's record, claim it on
// your own, log in again and the new JWT carries it. These handlers used a
// guard that admitted `editor`, which made that a three-request escalation from
// the lowest staff role — and would have undone every director-only
// restriction elsewhere. Hence: no editors here at all, email treated as an
// identity claim rather than a profile field, and the director's own record
// off-limits to everyone else.

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

interface TargetUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

async function findUser(id: string): Promise<TargetUser | undefined> {
  const [row] = await sql`
    SELECT id, email, first_name, last_name, role FROM users WHERE id = ${id}
  `
  return row as TargetUser | undefined
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { id } = await params
  const { data: body, error } = await parseBody(req, ActionSchema)
  if (error) return error

  const target = await findUser(id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const callerIsDirector = isDirector(session.email)
  // Only the director may act on the director's own record.
  if (isDirector(target.email) && !callerIsDirector) return forbidden()

  if (body.action === 'grant_premium') {
    const expiry = new Date()
    expiry.setFullYear(expiry.getFullYear() + 1)
    await sql`UPDATE users SET membership_expiry = ${expiry.toISOString()} WHERE id = ${id}`
    logActivity(session, 'user.grant_premium', { targetType: 'user', targetId: id, details: { expiry: expiry.toISOString() } })

  } else if (body.action === 'revoke_premium') {
    await sql`UPDATE users SET membership_expiry = NULL WHERE id = ${id}`
    logActivity(session, 'user.revoke_premium', { targetType: 'user', targetId: id })

  } else if (body.action === 'update') {
    const email = body.email ? body.email.toLowerCase() : target.email

    // Changing an address, or claiming the founder address, is an identity
    // change rather than a profile edit. Admins may still fix names.
    if (email !== target.email && !callerIsDirector) return forbidden()
    if (isDirector(email) && !callerIsDirector) return forbidden()

    // first_name/last_name are NOT NULL; fall back rather than writing null.
    const firstName = body.first_name || target.first_name
    const lastName = body.last_name || target.last_name

    let createdAt: string | undefined
    if (body.created_at !== undefined) {
      const parsed = new Date(body.created_at)
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
        return NextResponse.json({ error: 'Joined date must be a valid date not in the future' }, { status: 400 })
      }
      createdAt = parsed.toISOString()
    }

    if (createdAt) {
      await sql`
        UPDATE users
        SET first_name = ${firstName}, last_name = ${lastName}, email = ${email}, created_at = ${createdAt}
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE users
        SET first_name = ${firstName}, last_name = ${lastName}, email = ${email}
        WHERE id = ${id}
      `
    }
    logActivity(session, 'user.update', {
      targetType: 'user', targetId: id,
      details: { first_name: firstName, last_name: lastName, email, created_at: createdAt },
    })

  } else if (body.action === 'set_role') {
    if (!callerIsDirector) return forbidden()
    const role = ['user', 'editor', 'admin'].includes(body.role) ? body.role : 'user'
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`
    logActivity(session, 'user.set_role', { targetType: 'user', targetId: id, details: { from: target.role, to: role } })

  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { id } = await params
  const target = await findUser(id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const callerIsDirector = isDirector(session.email)

  // Removing a privileged account is the destructive twin of promoting one, so
  // it belongs to the director alone. Without this an admin could delete the
  // director outright.
  const targetIsPrivileged =
    isDirector(target.email) || target.role === 'admin' || target.role === 'editor'
  if (targetIsPrivileged && !callerIsDirector) return forbidden()

  // Deleting the account you are signed in as leaves a live session pointing at
  // a row that no longer exists.
  if (session.id === id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  await sql`DELETE FROM users WHERE id = ${id}`
  logActivity(session, 'user.delete', { targetType: 'user', targetId: id, details: { email: target.email, role: target.role } })
  return NextResponse.json({ success: true })
}
