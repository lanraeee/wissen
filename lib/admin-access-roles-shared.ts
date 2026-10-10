// Client-safe half of the named-role (RBAC) store, same split as
// lib/admin-access-grants-shared.ts. A role is a named bundle of section
// grants; an account is assigned zero or more roles, and its effective access
// is the union of those roles plus any direct per-account grants, with 'write'
// beating 'read' where they overlap. Editing a role therefore changes every
// account holding it -- that is the point of having roles rather than copying
// grants onto each account.

import { ALL_SECTIONS, SECTION_KEYS } from './admin-sections'
import type { AccessGrants, AccessLevel } from './admin-access-grants-shared'

export interface AccessRole {
  name: string
  description: string
  grants: Record<string, AccessLevel>
}

export interface AccessRoles {
  /** role id -> definition. */
  roles: Record<string, AccessRole>
  /** email (lowercased) -> role ids held. */
  assignments: Record<string, string[]>
}

export const ACCESS_ROLES_KEY = 'admin_access_roles'
export const ACCESS_ROLES_DEFAULTS: AccessRoles = { roles: {}, assignments: {} }
export const MAX_ROLES = 30
export const ROLE_ID_PATTERN = /^[a-z0-9_-]{1,40}$/

const SECTION_KEY_SET = new Set(SECTION_KEYS)

export function coerceRoleGrants(raw: unknown): Record<string, AccessLevel> {
  const out: Record<string, AccessLevel> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [key, level] of Object.entries(raw as Record<string, unknown>)) {
    if (!SECTION_KEY_SET.has(key)) continue
    if (level !== 'read' && level !== 'write') continue
    out[key] = level
  }
  return out
}

export function coerceAccessRoles(raw: unknown): AccessRoles {
  const v = (raw ?? {}) as Partial<AccessRoles>
  const roles: Record<string, AccessRole> = {}
  if (v.roles && typeof v.roles === 'object' && !Array.isArray(v.roles)) {
    for (const [id, def] of Object.entries(v.roles).slice(0, MAX_ROLES)) {
      if (!ROLE_ID_PATTERN.test(id) || !def || typeof def !== 'object') continue
      const d = def as Partial<AccessRole>
      const name = typeof d.name === 'string' ? d.name.trim().slice(0, 60) : ''
      if (!name) continue
      roles[id] = {
        name,
        description: typeof d.description === 'string' ? d.description.trim().slice(0, 300) : '',
        grants: coerceRoleGrants(d.grants),
      }
    }
  }

  const assignments: Record<string, string[]> = {}
  if (v.assignments && typeof v.assignments === 'object' && !Array.isArray(v.assignments)) {
    for (const [emailRaw, ids] of Object.entries(v.assignments).slice(0, 200)) {
      const email = emailRaw.trim().toLowerCase()
      if (!email.includes('@') || !Array.isArray(ids)) continue
      const held = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id in roles)))
      if (held.length) assignments[email] = held
    }
  }
  return { roles, assignments }
}

export interface EffectiveLevel {
  level: AccessLevel
  /** 'direct' and/or the ids of the roles that confer this level. */
  sources: string[]
}

const RANK: Record<AccessLevel, number> = { read: 1, write: 2 }

/** Section key -> highest level this email holds, and where each came from. */
export function effectiveLevels(email: string, grants: AccessGrants, roles: AccessRoles): Record<string, EffectiveLevel> {
  const key = email.trim().toLowerCase()
  const out: Record<string, EffectiveLevel> = {}
  const add = (section: string, level: AccessLevel, source: string) => {
    const cur = out[section]
    if (!cur || RANK[level] > RANK[cur.level]) out[section] = { level, sources: [source] }
    else if (RANK[level] === RANK[cur.level] && !cur.sources.includes(source)) cur.sources.push(source)
  }
  for (const [section, level] of Object.entries(grants.grants[key] ?? {})) add(section, level, 'direct')
  for (const id of roles.assignments[key] ?? []) {
    const role = roles.roles[id]
    if (!role) continue
    for (const [section, level] of Object.entries(role.grants)) add(section, level, id)
  }
  return out
}

function allSections(level: AccessLevel, only?: string[]): Record<string, AccessLevel> {
  return Object.fromEntries(ALL_SECTIONS.filter(s => !only || only.includes(s.key)).map(s => [s.key, level]))
}

/** Starting points offered in the Roles tab. Nothing is stored until the master admin adds one. */
export const PRESET_ROLES: { name: string; description: string; grants: Record<string, AccessLevel> }[] = [
  {
    name: 'Finance officer',
    description: 'Donations, bank transfers, monthly giving and the WHF-CIO ledger and costs.',
    grants: {
      donations: 'write', bank_transfers: 'write', giving: 'write',
      'whf_cio.ledger': 'write', 'whf_cio.costs': 'write', analytics: 'read',
    },
  },
  {
    name: 'Content manager',
    description: 'Site copy, testimonials, opportunities and the knowledge base.',
    grants: {
      content: 'write', testimonials: 'write', opportunities: 'write', knowledge: 'write',
      content_approvals: 'read', scholarships: 'read',
    },
  },
  {
    name: 'Support agent',
    description: 'Support tickets and contact messages; can see users and intake forms.',
    grants: { support: 'write', contact: 'write', volunteer: 'read', partner: 'read', users: 'read' },
  },
  {
    name: 'Company secretary',
    description: 'All WHF-CIO records tabs except the ledger and costs.',
    grants: Object.fromEntries(
      Object.keys(allSections('write', ['whf_cio.trustees', 'whf_cio.trustee_declarations', 'whf_cio.constitution', 'whf_cio.registrations', 'whf_cio.meetings', 'whf_cio.conflicts', 'whf_cio.policies', 'whf_cio.filings', 'whf_cio.documents']))
        .map(k => [k, 'write' as AccessLevel])
    ),
  },
  {
    name: 'Auditor (read-only)',
    description: 'Can open every section but change nothing.',
    grants: allSections('read'),
  },
]
