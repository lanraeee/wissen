import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { adminGuard, sectionGuard } from '@/lib/admin-guard'

// Joins each pledge back to the application/inquiry that created it, so the
// admin list can link straight to the applicant's record without a second
// round trip per row.
export async function GET() {
  if (!(await adminGuard() || await sectionGuard('giving'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT
      rp.*,
      CASE rp.source_type
        WHEN 'volunteer' THEN va.role
        WHEN 'partner' THEN pi.organisation
      END AS source_label
    FROM recurring_pledges rp
    LEFT JOIN volunteer_applications va ON rp.source_type = 'volunteer' AND va.id = rp.source_id
    LEFT JOIN partner_inquiries pi ON rp.source_type = 'partner' AND pi.id = rp.source_id
    ORDER BY rp.created_at DESC
  `
  return NextResponse.json({ pledges: rows })
}
