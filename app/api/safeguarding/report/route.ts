import { NextRequest, NextResponse } from 'next/server'
import { parseBody } from '@/lib/validation'
import { recordConcern } from '@/lib/safeguarding'
import { ReportSchema } from '@/lib/safeguarding-schema'
import { log } from '@/lib/logger'

// The "Report a concern" form on /safeguarding. Open to anyone, signed in or
// not, and anonymous reports are accepted. The report goes straight into the
// restricted incident log, never into a general staff inbox.
export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ReportSchema)
  if (error) return error

  // A filled honeypot is a bot. Answer as if it worked so it learns nothing.
  if (data.website) return NextResponse.json({ success: true, reference: null })

  try {
    const created = await recordConcern({
      source: 'safeguarding_form',
      reporterName: data.name,
      reporterEmail: data.email,
      reporterPhone: data.phone,
      reporterRelationship: data.relationship,
      personAtRisk: data.person_at_risk,
      concernType: data.concern_type ?? null,
      description: data.description,
      location: data.location,
      immediateDanger: data.immediate_danger,
    })
    if (!created) throw new Error('Incident insert returned no row')
    return NextResponse.json({ success: true, reference: created.reference })
  } catch (err) {
    log.error('safeguarding report', err)
    return NextResponse.json(
      { error: 'We could not save your report. Please email wissenhaus@outlook.com with the subject "Safeguarding concern", or call the emergency services if someone is in danger.' },
      { status: 500 },
    )
  }
}
