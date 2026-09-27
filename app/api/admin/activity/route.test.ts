const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin-guard')>('@/lib/admin-guard')
  return { ...actual, adminGuard: () => adminGuardMock() }
})

import { GET } from './route'

describe('GET /api/admin/activity', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('a director sees the unfiltered feed', async () => {
    adminGuardMock.mockResolvedValue({ id: 'dir-1', email: 'director@wissenhaus.org', role: 'admin' })
    sqlMock.mockResolvedValueOnce([{ action: 'x' }])
    const res = await GET()
    const body = await res.json()
    expect(body.viewerTier).toBe('director')
    const query = (sqlMock.mock.calls[0][0] as string[]).join('')
    expect(query).not.toContain('WHERE')
  })

  it('a non-director admin sees editor actions plus their own', async () => {
    adminGuardMock.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', role: 'admin' })
    sqlMock.mockResolvedValueOnce([])
    const res = await GET()
    const body = await res.json()
    expect(body.viewerTier).toBe('admin')
    const query = (sqlMock.mock.calls[0][0] as string[]).join('')
    expect(query).toContain("actor_role = 'editor'")
  })

  it('an editor sees only their own actions', async () => {
    adminGuardMock.mockResolvedValue({ id: 'editor-1', email: 'editor@example.com', role: 'editor' })
    sqlMock.mockResolvedValueOnce([])
    const res = await GET()
    const body = await res.json()
    expect(body.viewerTier).toBe('editor')
    const query = (sqlMock.mock.calls[0][0] as string[]).join('')
    expect(query).toContain('actor_id =')
    expect(query).not.toContain("actor_role = 'editor'")
  })
})
