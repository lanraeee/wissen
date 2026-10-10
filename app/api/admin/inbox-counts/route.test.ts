const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
const trusteeGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock(), trusteeSectionsGuard: () => trusteeGuardMock() }))

import { GET } from './route'

describe('GET /api/admin/inbox-counts', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    trusteeGuardMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns pending counts per resource', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a', email: 'a@x.com', role: 'admin' })
    sqlMock
      .mockResolvedValueOnce([{ c: 2 }])
      .mockResolvedValueOnce([{ c: 1 }])
      .mockResolvedValueOnce([{ c: 0 }])
      .mockResolvedValueOnce([{ c: 3 }])
      .mockResolvedValueOnce([{ c: 5 }])
      .mockResolvedValueOnce([{ c: 4 }])
      .mockResolvedValueOnce([{ c: 6 }])
      .mockResolvedValueOnce([{ c: 2 }])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      contact: 2, volunteer: 1, partner: 0, bank_transfer: 3, scholarship: 5,
      content_approval: 4, support: 6, kb_pending: 2,
    })
  })
})
