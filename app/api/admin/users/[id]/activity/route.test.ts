import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
const userAdminGuardMock = vi.fn()
const directorGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin-guard')>('@/lib/admin-guard')
  return {
    ...actual,
    adminGuard: () => adminGuardMock(),
    userAdminGuard: () => userAdminGuardMock(),
    directorGuard: () => directorGuardMock(),
  }
})

import { GET } from './route'

function req() {
  return new NextRequest('http://localhost/api/admin/users/target-1/activity')
}

function ctx(id = 'target-1') {
  return { params: Promise.resolve({ id }) }
}

const EDITOR_VIEWER = { id: 'viewer-1', email: 'editor@example.com', role: 'editor' }
const ADMIN_VIEWER = { id: 'viewer-2', email: 'admin@example.com', role: 'admin' }
const DIRECTOR_VIEWER = { id: 'viewer-3', email: 'director@wissenhaus.org', role: 'admin' }

function targetUser(overrides: Partial<{ email: string; role: string }> = {}) {
  return { id: 'target-1', email: 'member@example.com', first_name: 'Ada', last_name: 'Lovelace', role: 'user', ...overrides }
}

describe('GET /api/admin/users/[id]/activity', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sqlMock.mockResolvedValue([]) // default: every downstream query returns empty
  })

  it('returns 404 when the target user does not exist', async () => {
    sqlMock.mockResolvedValueOnce([]) // findUser
    adminGuardMock.mockResolvedValue(EDITOR_VIEWER)
    const res = await GET(req(), ctx())
    expect(res.status).toBe(404)
  })

  describe('target is an ordinary user', () => {
    it('is viewable by an editor-level admin (adminGuard) and returns usage data', async () => {
      sqlMock.mockResolvedValueOnce([targetUser()]) // findUser
      adminGuardMock.mockResolvedValue(EDITOR_VIEWER)
      const res = await GET(req(), ctx())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.kind).toBe('user')
      expect(body).toHaveProperty('courseProgress')
      expect(body).toHaveProperty('pageViews')
      expect(body).toHaveProperty('logins')
    })

    it('is forbidden to an unauthenticated caller', async () => {
      sqlMock.mockResolvedValueOnce([targetUser()])
      adminGuardMock.mockResolvedValue(null)
      const res = await GET(req(), ctx())
      expect(res.status).toBe(403)
    })
  })

  describe('target is an editor', () => {
    it('is forbidden to a fellow editor (adminGuard would pass, but this route requires userAdminGuard)', async () => {
      sqlMock.mockResolvedValueOnce([targetUser({ role: 'editor' })])
      userAdminGuardMock.mockResolvedValue(null) // editor is not admitted by userAdminGuard
      const res = await GET(req(), ctx())
      expect(res.status).toBe(403)
    })

    it('is viewable by an admin and returns the staff audit log', async () => {
      sqlMock.mockResolvedValueOnce([targetUser({ role: 'editor' })]).mockResolvedValueOnce([
        { action: 'content.update', target_type: 'site_content', target_id: 'homepage_hero', details: null, created_at: '2026-01-01' },
      ])
      userAdminGuardMock.mockResolvedValue(ADMIN_VIEWER)
      const res = await GET(req(), ctx())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.kind).toBe('staff')
      expect(body.entries).toHaveLength(1)
      expect(body.entries[0].action).toBe('content.update')
    })
  })

  describe('target is an admin (non-director)', () => {
    it('is forbidden to another admin -- only the director may view', async () => {
      sqlMock.mockResolvedValueOnce([targetUser({ email: 'other-admin@example.com', role: 'admin' })])
      directorGuardMock.mockResolvedValue(null) // caller is an admin, not the director
      const res = await GET(req(), ctx())
      expect(res.status).toBe(403)
    })

    it('is viewable by the director', async () => {
      sqlMock.mockResolvedValueOnce([targetUser({ email: 'other-admin@example.com', role: 'admin' })]).mockResolvedValueOnce([])
      directorGuardMock.mockResolvedValue(DIRECTOR_VIEWER)
      const res = await GET(req(), ctx())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.kind).toBe('staff')
    })
  })

  it('treats an account with a director email as privileged even if its role column is not "admin"', async () => {
    sqlMock.mockResolvedValueOnce([targetUser({ email: 'director@wissenhaus.org', role: 'user' })])
    directorGuardMock.mockResolvedValue(null)
    const res = await GET(req(), ctx())
    // director-tier guard was consulted (and here denies), proving the email
    // check overrides a merely-'user' role column.
    expect(directorGuardMock).toHaveBeenCalled()
    expect(res.status).toBe(403)
  })
})
