import { NextRequest, NextResponse } from 'next/server'
import { directorGuard, safeguardingGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { parseBody } from '@/lib/validation'
import { dbErrorResponse } from '@/lib/whf-cio'
import { SAFEGUARDING_LEAD_EMAIL, ensureTeamAccount } from '@/lib/safeguarding'
import { TeamMemberSchema } from '@/lib/safeguarding-schema'
import { createPasswordResetUrl } from '@/lib/password-reset'
import { sendPasswordResetEmail } from '@/lib/email'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

// The designated safeguarding team. Anyone on it can see who else is; only
// directors can change it.
export async function GET() {
  const session = await safeguardingGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const rows = await sql`
      SELECT t.id, t.email, t.name, t.role_title, t.added_by, t.created_at, (u.id IS NOT NULL) AS has_account
      FROM cio_safeguarding_team t
      LEFT JOIN users u ON u.email = t.email
      ORDER BY t.created_at
    `
    const [lead] = await sql`SELECT id FROM users WHERE email = ${SAFEGUARDING_LEAD_EMAIL}`
    return NextResponse.json({
      lead: { email: SAFEGUARDING_LEAD_EMAIL, has_account: !!lead },
      members: rows.filter(r => r.email !== SAFEGUARDING_LEAD_EMAIL),
    })
  } catch (err) {
    log.error('safeguarding team', err)
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

// Adds a member (or, for the lead address, just sets up its login). If the
// address has no account yet, one is created with an unusable password and a
// set-password link is emailed to it -- see ensureTeamAccount() for why the
// account must not be left for anyone to register.
export async function POST(req: NextRequest) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Only directors can change the safeguarding team' }, { status: 403 })

  const { data, error } = await parseBody(req, TeamMemberSchema)
  if (error) return error

  try {
    if (data.email !== SAFEGUARDING_LEAD_EMAIL) {
      await sql`
        INSERT INTO cio_safeguarding_team (email, name, role_title, added_by)
        VALUES (${data.email}, ${data.name}, ${data.role_title}, ${session.email})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_title = EXCLUDED.role_title
      `
    }

    const createdUserId = await ensureTeamAccount(data.email, data.name)
    let invited = false
    if (createdUserId) {
      try {
        const url = await createPasswordResetUrl(createdUserId)
        await sendPasswordResetEmail(data.email, data.name || 'Safeguarding Team', url)
        invited = true
      } catch (err) {
        log.error('safeguarding team invite', err)
      }
    }

    await logActivity(session, 'whf_cio.safeguarding.team_add', {
      targetType: 'cio_safeguarding_team', details: { email: data.email, account_created: !!createdUserId, invited },
    })
    return NextResponse.json({ success: true, accountCreated: !!createdUserId, invited }, { status: 201 })
  } catch (err) {
    log.error('safeguarding team', err)
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
