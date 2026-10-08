// Client-safe half of the trustee access-grants store: shape, defaults, and
// coercion, no server imports -- mirrors lib/ai-settings-shared.ts's split
// for the same reason (the Access Control editor renders the same defaults
// the server falls back to).
//
// Stored as one site_content row, same pattern as ai_settings: a single
// JSON blob is enough here (bounded list of trustee emails, bounded list
// of section keys each), and it reuses the existing generic
// /api/admin/content/[key] GET/PUT endpoints rather than a new table/route.

import { SECTION_KEYS } from './admin-sections'

/** 'write' implies 'read' too -- there is no write-only grant, since you cannot sensibly edit a section's data without first being able to see it. */
export type AccessLevel = 'read' | 'write'

export interface AccessGrants {
  /** email (lowercased) -> section key -> access level. */
  grants: Record<string, Record<string, AccessLevel>>
}

export const ACCESS_GRANTS_DEFAULTS: AccessGrants = { grants: {} }
export const ACCESS_GRANTS_KEY = 'admin_access_grants'

const SECTION_KEY_SET = new Set(SECTION_KEYS)

export function coerceAccessGrants(raw: unknown): AccessGrants {
  const v = (raw ?? {}) as Partial<AccessGrants>
  if (!v.grants || typeof v.grants !== 'object') return { grants: {} }
  const grants: Record<string, Record<string, AccessLevel>> = {}
  for (const [emailRaw, levelsRaw] of Object.entries(v.grants).slice(0, 200)) {
    const email = emailRaw.trim().toLowerCase()
    if (!email.includes('@')) continue
    if (!levelsRaw || typeof levelsRaw !== 'object' || Array.isArray(levelsRaw)) continue
    const levels: Record<string, AccessLevel> = {}
    for (const [key, levelRaw] of Object.entries(levelsRaw as Record<string, unknown>).slice(0, SECTION_KEYS.length)) {
      if (!SECTION_KEY_SET.has(key)) continue
      if (levelRaw !== 'read' && levelRaw !== 'write') continue
      levels[key] = levelRaw
    }
    if (Object.keys(levels).length) grants[email] = levels
  }
  return { grants }
}
