import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

import { GET } from './route'

function ctx(id = '1') {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/admin/career-fair/events/[id]/registrations', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('lists registrations for the event', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a', email: 'a@x.com', role: 'admin' })
    sqlMock.mockResolvedValueOnce([{ id: 'r1', name: 'Ada' }])
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.registrations).toEqual([{ id: 'r1', name: 'Ada' }])
  })
})
