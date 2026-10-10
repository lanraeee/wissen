import { describe, it, expect } from 'vitest'
import { coerceAccessRoles, coerceRoleGrants, effectiveLevels, PRESET_ROLES, type AccessRoles } from './admin-access-roles-shared'
import { SECTION_KEYS } from './admin-sections'

const roles: AccessRoles = {
  roles: {
    fin: { name: 'Finance', description: '', grants: { donations: 'write', analytics: 'read' } },
    aud: { name: 'Auditor', description: '', grants: { donations: 'read', analytics: 'read' } },
  },
  assignments: { 'a@x.org': ['fin'], 'b@x.org': ['aud', 'fin'] },
}

describe('coerceRoleGrants', () => {
  it('drops unknown sections and invalid levels', () => {
    expect(coerceRoleGrants({ donations: 'write', nope: 'read', analytics: 'admin' })).toEqual({ donations: 'write' })
  })
  it('rejects non-objects', () => {
    expect(coerceRoleGrants(null)).toEqual({})
    expect(coerceRoleGrants([])).toEqual({})
  })
})

describe('coerceAccessRoles', () => {
  it('returns empty for garbage', () => {
    expect(coerceAccessRoles(undefined)).toEqual({ roles: {}, assignments: {} })
  })
  it('drops nameless roles, bad ids and assignments to unknown roles', () => {
    const out = coerceAccessRoles({
      roles: { ok: { name: ' Ok ', grants: { donations: 'read' } }, 'Bad Id': { name: 'x' }, empty: { name: '  ' } },
      assignments: { 'A@X.org': ['ok', 'ghost'], 'c@x.org': ['ghost'], notanemail: ['ok'] },
    })
    expect(Object.keys(out.roles)).toEqual(['ok'])
    expect(out.roles.ok.name).toBe('Ok')
    expect(out.assignments).toEqual({ 'a@x.org': ['ok'] })
  })
})

describe('effectiveLevels', () => {
  it('is empty for an account with nothing', () => {
    expect(effectiveLevels('z@x.org', { grants: {} }, roles)).toEqual({})
  })
  it('gives role grants with the role as source', () => {
    expect(effectiveLevels('a@x.org', { grants: {} }, roles).donations).toEqual({ level: 'write', sources: ['fin'] })
  })
  it('is case-insensitive on email', () => {
    expect(effectiveLevels('  A@X.org ', { grants: {} }, roles).donations?.level).toBe('write')
  })
  it('write beats read across sources', () => {
    const out = effectiveLevels('b@x.org', { grants: {} }, roles)
    expect(out.donations).toEqual({ level: 'write', sources: ['fin'] })
    expect(out.analytics.level).toBe('read')
    expect(out.analytics.sources.sort()).toEqual(['aud', 'fin'])
  })
  it('combines direct grants with roles', () => {
    const out = effectiveLevels('a@x.org', { grants: { 'a@x.org': { donations: 'read', users: 'read' } } }, roles)
    expect(out.donations).toEqual({ level: 'write', sources: ['fin'] })
    expect(out.users).toEqual({ level: 'read', sources: ['direct'] })
  })
  it('a direct write upgrades a role read', () => {
    const out = effectiveLevels('c@x.org', { grants: { 'c@x.org': { analytics: 'write' } } }, { roles: roles.roles, assignments: { 'c@x.org': ['aud'] } })
    expect(out.analytics).toEqual({ level: 'write', sources: ['direct'] })
  })
  it('ignores assignments to deleted roles', () => {
    expect(effectiveLevels('d@x.org', { grants: {} }, { roles: {}, assignments: { 'd@x.org': ['gone'] } })).toEqual({})
  })
})

describe('PRESET_ROLES', () => {
  it('only references real sections', () => {
    for (const p of PRESET_ROLES) {
      expect(Object.keys(p.grants).length).toBeGreaterThan(0)
      for (const k of Object.keys(p.grants)) expect(SECTION_KEYS).toContain(k)
    }
  })
  it('auditor is strictly read-only', () => {
    const aud = PRESET_ROLES.find(p => p.name.startsWith('Auditor'))!
    expect(Object.values(aud.grants).every(l => l === 'read')).toBe(true)
  })
})
