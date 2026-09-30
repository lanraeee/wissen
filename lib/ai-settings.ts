import sql from '@/lib/db'
import { log } from '@/lib/logger'
import { isMasterAdmin } from '@/lib/admin-guard'
import { AI_SETTINGS_KEY, AI_SETTINGS_DEFAULTS, coerceAiSettings, type AiSettings } from '@/lib/ai-settings-shared'

export type { AiSettings }
export { AI_SETTINGS_KEY, AI_SETTINGS_DEFAULTS }

// Read directly rather than through getSiteContent(): that wraps
// unstable_cache, which needs an incremental-cache context and throws outside
// one -- the same thing that broke lib/email-render.ts. This is read on a
// path that must not fail, so it falls back to the code defaults if the
// database is briefly unreachable.
export async function getAiSettings(): Promise<AiSettings> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = ${AI_SETTINGS_KEY}`
    return coerceAiSettings(rows[0]?.value)
  } catch (err) {
    log.warn('ai settings', 'falling back to defaults', { error: String(err) })
    return AI_SETTINGS_DEFAULTS
  }
}

// Who may use the staff-facing database agent.
//
// The agent can read every table, so this is deliberately stricter than
// adminGuard() -- editors and ordinary admins do not get it by default.
// Access is: the master admin always, plus anyone the master admin has
// explicitly granted while the master switch is on.
//
// The master admin's access is derived from isMasterAdmin(), not from the
// grant list, so editing that list can never lock the one account that
// manages the agent out of managing it.
export async function canUseAdminAgent(email: string | undefined): Promise<boolean> {
  if (!email) return false
  if (isMasterAdmin(email)) return true

  const settings = await getAiSettings()
  if (!settings.adminAgentEnabled) return false
  return settings.adminAgentAllowedEmails.includes(email.trim().toLowerCase())
}
