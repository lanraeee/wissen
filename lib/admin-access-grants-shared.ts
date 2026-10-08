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

export interface AccessGrants {
  /** email (lowercased) -> granted section keys. */
  grants: Record<string, string[]>
}

export const ACCESS_GRANTS_DEFAULTS: AccessGrants = { grants: {} }
export const ACCESS_GRANTS_KEY = 'admin_access_grants'

const SECTION_KEY_SET = new Set(SECTION_KEYS)

export function coerceAccessGrants(raw: unknown): AccessGrants {
  const v = (raw ?? {}) as Partial<AccessGrants>
  if (!v.grants || typeof v.grants !== 'object') return { grants: {} }
  const grants: Record<string, string[]> = {}
  for (const [emailRaw, keysRaw] of Object.entries(v.grants).slice(0, 200)) {
    const email = emailRaw.trim().toLowerCase()
    if (!email.includes('@')) continue
    if (!Array.isArray(keysRaw)) continue
    const keys = keysRaw.filter((k): k is string => typeof k === 'string' && SECTION_KEY_SET.has(k))
    if (keys.length) grants[email] = keys
  }
  return { grants }
}
