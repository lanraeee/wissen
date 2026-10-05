import { NextRequest, NextResponse } from 'next/server'
import { safeguardingGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { parseBody } from '@/lib/validation'
import { dbErrorResponse } from '@/lib/whf-cio'
import { createIncident } from '@/lib/safeguarding'
import { ManualIncidentSchema } from '@/lib/safeguarding-schema'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

// Safeguarding records are the most sensitive thing the site holds, so even
// reading the list is written to the activity log.
export async function GET() {
  const session = await safeguardingGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const rows = await sql`
      SELECT * FROM cio_safeguarding_incidents
      ORDER BY (status = 'closed'), reported_at DESC
      LIMIT 500
    `
    await logActivity(session, 'whf_cio.safeguarding.view', { targetType: 'cio_safeguarding_incidents', details: { count: rows.length } })
    return NextResponse.json(rows)
  } catch (err) {
    log.error('safeguarding', err)
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

// A concern that reached the team some other way (a phone call, a
// conversation at an event) is logged here by hand.
export async function POST(req: NextRequest) {
  const session = await safeguardingGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await parseBody(req, ManualIncidentSchema)
  if (error) return error

  try {
    const created = await createIncident({
      source: 'manual',
      reporterName: data.reporter_name,
      reporterEmail: data.reporter_email,
      reporterPhone: data.reporter_phone,
      reporterRelationship: data.reporter_relationship,
      personAtRisk: data.person_at_risk,
      concernType: data.concern_type ?? null,
      description: data.description,
      location: data.location,
      immediateDanger: data.immediate_danger,
      createdBy: session.email,
    })
    if (!created) return NextResponse.json({ error: 'Could not log the incident' }, { status: 500 })
    await logActivity(session, 'whf_cio.safeguarding.create', { targetType: 'cio_safeguarding_incidents', targetId: created.id, details: { reference: created.reference } })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    log.error('safeguarding', err)
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
