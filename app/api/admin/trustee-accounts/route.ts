import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { masterAdminGuard } from '@/lib/admin-guard'
import { hashPassword } from '@/lib/auth'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { parseBody, zEmail, zName } from '@/lib/validation'
import sql from '@/lib/db'

// Trustee accounts: logins for people who are not otherwise staff (not an
// admin/editor, not a director), created by the master admin so they can be
// granted specific admin sections (lib/admin-access-grants.ts). Same
// unusable-password pattern as lib/safeguarding.ts's ensureTeamAccount() --
// including leaving email_verified_at NULL, so the account sits unusable
// until its owner claims it via "Forgot password" and proves they read that
// mailbox, rather than this endpoint vouching for an address master admin
// merely typed in. role is set explicitly to 'trustee', which is what makes
// adminRole() resolve them to the zero-access-by-default path at all.
const Body = z.object({ email: zEmail, firstName: zName, lastName: zName })

export async function GET() {
  const session = await masterAdminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const rows = await sql`
    SELECT id, email, first_name, last_name, created_at
    FROM users WHERE role = 'trustee' ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await masterAdminGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await parseBody(req, Body)
  if (error) return error
  const email = data.email.toLowerCase()

  const existing = await sql`SELECT id, role FROM users WHERE email = ${email}`
  if (existing.length) {
    return NextResponse.json(
      { error: existing[0].role === 'trustee' ? 'This trustee account already exists' : 'A user with this email already exists with a different role' },
      { status: 409 }
    )
  }

  const unusable = await hashPassword(crypto.randomBytes(32).toString('hex'))
  const rows = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES (${email}, ${unusable}, ${data.firstName}, ${data.lastName}, 'trustee')
    RETURNING id, email, first_name, last_name, created_at
  `
  await logActivity(session, 'trustee_account.create', { targetType: 'users', targetId: rows[0].id })
  log.info('trustee-accounts', 'created', { email })
  return NextResponse.json(rows[0], { status: 201 })
}
