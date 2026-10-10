import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, directorGuard, masterAdminGuard, adminRole, sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { ACCESS_GRANTS_KEY } from '@/lib/admin-access-grants-shared'
import { ACCESS_ROLES_KEY } from '@/lib/admin-access-roles-shared'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { writeContent } from '@/lib/content-approvals'
import { logActivity } from '@/lib/audit-log'

// site_content.value shape varies per key by design (each admin editor owns
// its own shape) so this stays a generic JSON blob rather than a per-key
// schema — bounded in size to stop this generic endpoint being used to
// stuff arbitrary large payloads into the database.
const ContentSchema = z.object({
  value: z.unknown().refine(
    v => JSON.stringify(v).length <= 500_000,
    { message: 'value is too large' }
  ),
})

// Most site_content keys hold public copy, and adminGuard() — which admits the
// `editor` role — is the right gate for those. These keys do not: they hold the
// bank account donors are told to pay into. An editor able to rewrite this key
// could silently redirect every bank-transfer donation, with the foundation's
// own name and branding still attached to the instructions email. Require the
// director for them, matching how role assignment is already restricted.
const DIRECTOR_ONLY_KEYS = new Set(['bank_transfer_details', 'ai_settings'])

// Who may grant/revoke every other section: the master admin only, not even
// a director -- same restriction as the AI agent's allow-list, and for the
// same reason (this key decides who can reach the other sensitive ones).
const MASTER_ADMIN_ONLY_KEYS = new Set([ACCESS_GRANTS_KEY, ACCESS_ROLES_KEY])

// Which admin section a trustee needs to read or write each key. Staff
// (admin/editor) are not subject to this -- adminGuard() admits them for every
// key outside the two restricted sets above -- so it only decides what a
// trustee's grant covers. Unlisted keys are public page copy, which is the
// Content section.
const KEY_SECTION: Record<string, string> = {
  site_settings: 'settings', contact_details: 'settings', foundation_details: 'settings',
  donation_settings: 'settings', donation_certificates: 'settings', whatsapp_channel: 'settings',
  courses: 'courses', partner_scholarships: 'scholarships',
}

async function guardFor(key: string, level: 'read' | 'write' = 'read') {
  if (MASTER_ADMIN_ONLY_KEYS.has(key)) return masterAdminGuard()
  if (DIRECTOR_ONLY_KEYS.has(key)) return directorGuard()
  const staff = await adminGuard()
  if (staff) return staff
  const section = KEY_SECTION[key] ?? 'content'
  return level === 'write' ? sectionWriteGuard(section) : sectionGuard(section)
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!await guardFor(key)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await sql`SELECT value FROM site_content WHERE key = ${key}`
  return NextResponse.json({ value: rows[0]?.value ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const session = await guardFor(key, 'write')
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, ContentSchema)
  if (error) return error
  const { value } = data

  // Editors propose, directors publish. This is the one chokepoint every
  // content editor in the admin writes through, so gating it here covers all
  // of them -- page copy, OG metadata, partner scholarships, the tagline --
  // without each component needing to know about approvals.
  if (await adminRole() === 'editor') {
    const prev = await sql`SELECT value FROM site_content WHERE key = ${key}`
    await sql`
      INSERT INTO content_change_requests
        (content_key, proposed_value, previous_value, requested_by_id, requested_by_email)
      VALUES (${key}, ${JSON.stringify(value)}, ${JSON.stringify(prev[0]?.value ?? null)},
              ${session.id}, ${session.email})
    `
    logActivity(session, 'content.request', { targetType: 'site_content', targetId: key })
    return NextResponse.json({ success: true, pending: true })
  }

  await writeContent(key, value)
  logActivity(session, 'content.update', { targetType: 'site_content', targetId: key })
  return NextResponse.json({ success: true })
}
