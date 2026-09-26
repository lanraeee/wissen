import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

const logActivityMock = vi.fn()
vi.mock('@/lib/audit-log', () => ({ logActivity: (...args: unknown[]) => logActivityMock(...args) }))

import { GET, POST } from './route'

const SESSION = { id: 'admin-1', email: 'admin@example.com', role: 'admin' }

function req(body: unknown) {
  return new NextRequest('http://localhost/api/admin/career-fair/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/admin/career-fair/events', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not authenticated as staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('lists events with registration counts', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([{ id: 1, title: 'Fair', registration_count: 3, checked_in_count: 1 }])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events).toHaveLength(1)
  })
})

describe('POST /api/admin/career-fair/events', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not authenticated as staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await POST(req({ slug: 'x', title: 'X' }))
    expect(res.status).toBe(403)
  })

  it('creates an event, slugifying the provided slug', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([{ id: 1, slug: 'ibadan-2026', title: 'Ibadan Fair' }])
    const res = await POST(req({ slug: 'Ibadan 2026!', title: 'Ibadan Fair' }))
    expect(res.status).toBe(201)
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_event.create', expect.objectContaining({ targetType: 'fair_event' }))
  })

  it('rejects a missing title', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    const res = await POST(req({ slug: 'x' }))
    expect(res.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
