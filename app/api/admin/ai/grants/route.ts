import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { masterAdminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { getAiSettings, AI_SETTINGS_KEY } from '@/lib/ai-settings'
import { coerceAiSettings } from '@/lib/ai-settings-shared'
import { logActivity } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// Granting another account access to an agent that can read every table is
// the master admin's decision alone -- not a director's, not an admin's.
// Enforced here rather than only hidden in the UI, because a hidden button is
// not a permission.
const GrantSchema = z.object({
  emails: z.array(z.string().email().max(200)).max(50),
  enabled: z.boolean(),
})

export async function POST(req: NextRequest) {
  const session = await masterAdminGuard()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await parseBody(req, GrantSchema)
  if (error) return error

  const current = await getAiSettings()
  const next = coerceAiSettings({
    ...current,
    adminAgentEnabled: data.enabled,
    adminAgentAllowedEmails: data.emails,
  })

  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${AI_SETTINGS_KEY}, ${JSON.stringify(next)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(next)}, updated_at = NOW()
  `

  logActivity(session, 'ai.grants.update', { targetType: 'ai_settings' })
  return NextResponse.json({ success: true, settings: next })
}
