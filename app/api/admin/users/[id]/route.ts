import { NextRequest, NextResponse } from 'next/server'
import { userAdminGuard, isDirector } from '@/lib/admin-guard'
import sql from '@/lib/db'

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
  const body = await req.json()

  const target = await findUser(id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const callerIsDirector = isDirector(session.email)
  // Only the director may act on the director's own record.
  if (isDirector(target.email) && !callerIsDirector) return forbidden()

  if (body.action === 'grant_premium') {
    const expiry = new Date()
    expiry.setFullYear(expiry.getFullYear() + 1)
    await sql`UPDATE users SET membership_expiry = ${expiry.toISOString()} WHERE id = ${id}`

  } else if (body.action === 'revoke_premium') {
    await sql`UPDATE users SET membership_expiry = NULL WHERE id = ${id}`

  } else if (body.action === 'update') {
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : target.email

    // Changing an address, or claiming the founder address, is an identity
    // change rather than a profile edit. Admins may still fix names.
    if (email !== target.email && !callerIsDirector) return forbidden()
    if (isDirector(email) && !callerIsDirector) return forbidden()

    // first_name/last_name are NOT NULL; fall back rather than writing null.
    const firstName = typeof body.first_name === 'string' && body.first_name.trim()
      ? body.first_name.trim() : target.first_name
    const lastName = typeof body.last_name === 'string' && body.last_name.trim()
      ? body.last_name.trim() : target.last_name

    await sql`
      UPDATE users
      SET first_name = ${firstName}, last_name = ${lastName}, email = ${email}
      WHERE id = ${id}
    `

  } else if (body.action === 'set_role') {
    if (!callerIsDirector) return forbidden()
    const role = ['user', 'editor', 'admin'].includes(body.role) ? body.role : 'user'
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`

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
  return NextResponse.json({ success: true })
}
