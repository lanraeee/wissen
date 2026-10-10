const getSessionMock = vi.fn()
vi.mock('@/lib/auth', () => ({ getSession: () => getSessionMock() }))

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const levelMock = vi.fn()
const sectionsMock = vi.fn()
vi.mock('@/lib/admin-access-grants', () => ({
  getSectionLevel: (...a: unknown[]) => levelMock(...a),
  getGrantedSections: (...a: unknown[]) => sectionsMock(...a),
}))
vi.mock('@/lib/safeguarding', () => ({ isSafeguardingTeam: async () => false }))

import {
  adminGuard, userAdminGuard, directorGuard, masterAdminGuard, sectionGuard, sectionWriteGuard,
  trusteeSectionsGuard, adminRole, isDirector, isMasterAdmin, isBlockedAdmin,
} from './admin-guard'

const MASTER = { id: 'm', email: 'wissenhaus@outlook.com', role: 'admin' }
const FORMER_DIRECTOR = { id: 'd', email: 'director@wissenhaus.org', role: 'admin' }
const ADMIN = { id: 'a', email: 'admin@x.org', role: 'admin' }
const EDITOR = { id: 'e', email: 'editor@x.org', role: 'editor' }
const TRUSTEE = { id: 't', email: 'trustee@x.org', role: 'trustee' }

// The live-role lookup: pretend the database still agrees with the token.
function dbRole(role: string | null) {
  sqlMock.mockResolvedValue(role === null ? [] : [{ role }])
}

describe('admin-guard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('identity helpers', () => {
    it('only wissenhaus@outlook.com is master admin and director', () => {
      expect(isMasterAdmin('wissenhaus@outlook.com')).toBe(true)
      expect(isMasterAdmin('  WissenHaus@Outlook.com ')).toBe(true)
      expect(isDirector('wissenhaus@outlook.com')).toBe(true)
      expect(isDirector('director@wissenhaus.org')).toBe(false)
      expect(isMasterAdmin('director@wissenhaus.org')).toBe(false)
    })
    it('director@wissenhaus.org is blocked', () => {
      expect(isBlockedAdmin('Director@WissenHaus.org')).toBe(true)
      expect(isBlockedAdmin('wissenhaus@outlook.com')).toBe(false)
    })
  })

  describe('director@wissenhaus.org', () => {
    it('is refused by every guard even with an admin role', async () => {
      getSessionMock.mockResolvedValue(FORMER_DIRECTOR)
      dbRole('admin')
      levelMock.mockResolvedValue('write')
      expect(await adminGuard()).toBeNull()
      expect(await userAdminGuard()).toBeNull()
      expect(await directorGuard()).toBeNull()
      expect(await masterAdminGuard()).toBeNull()
      expect(await sectionGuard('donations')).toBeNull()
      expect(await sectionWriteGuard('donations')).toBeNull()
      expect(await adminRole()).toBeNull()
    })
  })

  describe('master admin', () => {
    it('passes everything without a database lookup', async () => {
      getSessionMock.mockResolvedValue(MASTER)
      expect(await adminGuard()).not.toBeNull()
      expect(await directorGuard()).not.toBeNull()
      expect(await masterAdminGuard()).not.toBeNull()
      expect(await sectionWriteGuard('whf_cio.ledger')).not.toBeNull()
      expect(await adminRole()).toBe('director')
      expect(sqlMock).not.toHaveBeenCalled()
    })
  })

  describe('staff', () => {
    it('admin passes adminGuard and userAdminGuard but not director/master', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      dbRole('admin')
      expect(await adminGuard()).not.toBeNull()
      expect(await userAdminGuard()).not.toBeNull()
      expect(await directorGuard()).toBeNull()
      expect(await masterAdminGuard()).toBeNull()
    })
    it('editor passes adminGuard only', async () => {
      getSessionMock.mockResolvedValue(EDITOR)
      dbRole('editor')
      expect(await adminGuard()).not.toBeNull()
      expect(await userAdminGuard()).toBeNull()
    })
    it('staff roles do not satisfy section guards', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      dbRole('admin')
      levelMock.mockResolvedValue('write')
      expect(await sectionGuard('donations')).toBeNull()
      expect(await sectionWriteGuard('donations')).toBeNull()
    })
  })

  describe('stale tokens', () => {
    it('refuses an admin token whose account was demoted', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      dbRole('user')
      expect(await adminGuard()).toBeNull()
      expect(await adminRole()).toBeNull()
    })
    it('refuses when the account row is gone', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      dbRole(null)
      expect(await adminGuard()).toBeNull()
    })
    it('refuses when the lookup fails', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      sqlMock.mockRejectedValue(new Error('db down'))
      expect(await adminGuard()).toBeNull()
    })
    it('refuses a trustee token whose account was demoted, despite grants', async () => {
      getSessionMock.mockResolvedValue(TRUSTEE)
      dbRole('user')
      levelMock.mockResolvedValue('write')
      expect(await sectionGuard('donations')).toBeNull()
    })
    it('honours a promotion-to-admin and a demotion-to-trustee at once', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      dbRole('trustee')
      levelMock.mockResolvedValue('read')
      expect(await adminGuard()).toBeNull()
      expect(await sectionGuard('donations')).not.toBeNull()
    })
    it('refuses with no session', async () => {
      getSessionMock.mockResolvedValue(null)
      expect(await adminGuard()).toBeNull()
      expect(await sectionGuard('donations')).toBeNull()
    })
  })

  describe('trustee read / write levels', () => {
    beforeEach(() => {
      getSessionMock.mockResolvedValue(TRUSTEE)
      dbRole('trustee')
    })
    it('no grant: neither read nor write', async () => {
      levelMock.mockResolvedValue(null)
      expect(await sectionGuard('donations')).toBeNull()
      expect(await sectionWriteGuard('donations')).toBeNull()
    })
    it('read grant: read passes, write refused', async () => {
      levelMock.mockResolvedValue('read')
      expect(await sectionGuard('donations')).not.toBeNull()
      expect(await sectionWriteGuard('donations')).toBeNull()
    })
    it('write grant: both pass', async () => {
      levelMock.mockResolvedValue('write')
      expect(await sectionGuard('donations')).not.toBeNull()
      expect(await sectionWriteGuard('donations')).not.toBeNull()
    })
    it('queries the level for the requested section only', async () => {
      levelMock.mockResolvedValue('read')
      await sectionGuard('whf_cio.meetings')
      expect(levelMock).toHaveBeenCalledWith('trustee@x.org', 'whf_cio.meetings')
    })
    it('is not an admin or director', async () => {
      levelMock.mockResolvedValue('write')
      expect(await adminGuard()).toBeNull()
      expect(await userAdminGuard()).toBeNull()
      expect(await directorGuard()).toBeNull()
      expect(await masterAdminGuard()).toBeNull()
      expect(await adminRole()).toBe('trustee')
    })
  })

  describe('trusteeSectionsGuard', () => {
    it('returns granted sections for a live trustee', async () => {
      getSessionMock.mockResolvedValue(TRUSTEE)
      dbRole('trustee')
      sectionsMock.mockResolvedValue(['contact', 'support'])
      const r = await trusteeSectionsGuard()
      expect(r?.sections).toEqual(['contact', 'support'])
    })
    it('refuses a trustee with no grants', async () => {
      getSessionMock.mockResolvedValue(TRUSTEE)
      dbRole('trustee')
      sectionsMock.mockResolvedValue([])
      expect(await trusteeSectionsGuard()).toBeNull()
    })
    it('refuses staff', async () => {
      getSessionMock.mockResolvedValue(ADMIN)
      dbRole('admin')
      expect(await trusteeSectionsGuard()).toBeNull()
    })
  })
})
