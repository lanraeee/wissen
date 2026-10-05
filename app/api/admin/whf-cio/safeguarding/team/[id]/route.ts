import { NextRequest, NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { dbErrorResponse, UUID_RE } from '@/lib/whf-cio'
import sql from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

// Removes someone's access to the incident log. Their user account stays.
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Only directors can change the safeguarding team' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const rows = await sql`DELETE FROM cio_safeguarding_team WHERE id = ${id} RETURNING email`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logActivity(session, 'whf_cio.safeguarding.team_remove', { targetType: 'cio_safeguarding_team', targetId: id, details: { email: rows[0].email } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('safeguarding team', err, { id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
