const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const getSessionMock = vi.fn()
vi.mock('@/lib/auth', () => ({ getSession: () => getSessionMock() }))

const recordVisitMock = vi.fn()
vi.mock('@/lib/streak', () => ({ recordVisit: (...args: unknown[]) => recordVisitMock(...args) }))

import { GET } from './route'

const SESSION = { id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace', membershipExpiry: null }

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sqlMock.mockResolvedValue([])
  })

  it('returns 401 with no session', async () => {
    getSessionMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    expect(recordVisitMock).not.toHaveBeenCalled()
  })

  it('records a visit on every authenticated check, not just at login', async () => {
    getSessionMock.mockResolvedValue(SESSION)
    recordVisitMock.mockResolvedValue(3)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.streak).toBe(3)
    expect(recordVisitMock).toHaveBeenCalledWith('user-1')
  })

  it('returns 500 without leaking details if recording the visit fails', async () => {
    getSessionMock.mockResolvedValue(SESSION)
    recordVisitMock.mockRejectedValue(new Error('db down'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
