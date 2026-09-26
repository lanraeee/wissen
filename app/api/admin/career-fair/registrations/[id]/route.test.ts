import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

const logActivityMock = vi.fn()
vi.mock('@/lib/audit-log', () => ({ logActivity: (...args: unknown[]) => logActivityMock(...args) }))

import { PATCH, DELETE } from './route'

const SESSION = { id: 'admin-1', email: 'admin@example.com', role: 'admin' }

function ctx(id = 'reg-1') {
  return { params: Promise.resolve({ id }) }
}

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/career-fair/registrations/reg-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/admin/career-fair/registrations/[id]', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await PATCH(patchReq({ checkedIn: true }), ctx())
    expect(res.status).toBe(403)
  })

  it('checks a registrant in and logs the action', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([{ id: 'reg-1', name: 'Ada', checked_in: true, checked_in_at: '2026-01-01' }])
    const res = await PATCH(patchReq({ checkedIn: true }), ctx())
    expect(res.status).toBe(200)
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_registration.check_in', expect.objectContaining({ targetId: 'reg-1' }))
  })

  it('undoes a check-in and logs the undo action', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([{ id: 'reg-1', name: 'Ada', checked_in: false, checked_in_at: null }])
    const res = await PATCH(patchReq({ checkedIn: false }), ctx())
    expect(res.status).toBe(200)
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_registration.undo_check_in', expect.any(Object))
  })

  it('returns 404 for an unknown registration', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([])
    const res = await PATCH(patchReq({ checkedIn: true }), ctx())
    expect(res.status).toBe(404)
  })

  it('rejects a non-boolean checkedIn value', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    const res = await PATCH(patchReq({ checkedIn: 'yes' }), ctx())
    expect(res.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/admin/career-fair/registrations/[id]', () => {
  beforeEach(() => vi.resetAllMocks())

  it('deletes the registration and logs the action', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([])
    const res = await DELETE({} as NextRequest, ctx())
    expect(res.status).toBe(200)
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_registration.delete', expect.objectContaining({ targetId: 'reg-1' }))
  })
})
