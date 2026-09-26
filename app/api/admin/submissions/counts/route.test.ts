const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

import { GET } from './route'

describe('GET /api/admin/submissions/counts', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns pending counts keyed by type', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a', email: 'a@x.com', role: 'admin' })
    sqlMock.mockResolvedValueOnce([{ type: 'contact', count: 2 }, { type: 'volunteer', count: 1 }])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ contact: 2, volunteer: 1 })
  })
})
