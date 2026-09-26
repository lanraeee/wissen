import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

const logActivityMock = vi.fn()
vi.mock('@/lib/audit-log', () => ({ logActivity: (...args: unknown[]) => logActivityMock(...args) }))

import { GET, PUT, DELETE } from './route'

const SESSION = { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
const EXISTING = {
  id: 1, slug: 'ibadan-2026', title: 'Ibadan Fair', school: 'IGS', location: 'Ibadan',
  event_date: '2026-11-01', event_time: '9am', status: 'draft', description: null, booths: [],
}

function ctx(id = '1') {
  return { params: Promise.resolve({ id }) }
}

function putReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/career-fair/events/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/admin/career-fair/events/[id]', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown event', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([])
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/admin/career-fair/events/[id]', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 404 for an unknown event', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([])
    const res = await PUT(putReq({ status: 'published' }), ctx())
    expect(res.status).toBe(404)
  })

  it('preserves fields not included in the request body', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([EXISTING]).mockResolvedValueOnce([{ ...EXISTING, status: 'published' }])
    const res = await PUT(putReq({ status: 'published' }), ctx())
    expect(res.status).toBe(200)
    const updateCall = sqlMock.mock.calls[1]
    expect(updateCall[1]).toBe(EXISTING.slug)
    expect(updateCall[2]).toBe(EXISTING.title)
    expect(updateCall[7]).toBe('published')
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_event.update', expect.objectContaining({ targetId: '1' }))
  })
})

describe('DELETE /api/admin/career-fair/events/[id]', () => {
  beforeEach(() => vi.resetAllMocks())

  it('deletes the event and logs the action', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([])
    const res = await DELETE({} as NextRequest, ctx())
    expect(res.status).toBe(200)
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_event.delete', expect.objectContaining({ targetId: '1' }))
  })
})
