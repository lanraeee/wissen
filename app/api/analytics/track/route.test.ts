import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

vi.mock('@/lib/auth', () => ({ getSession: vi.fn().mockResolvedValue(null) }))

const logErrorMock = vi.fn()
vi.mock('@/lib/logger', () => ({ log: { error: (...args: unknown[]) => logErrorMock(...args) } }))

import { POST } from './route'

function trackRequest(body: unknown) {
  return new NextRequest('http://localhost/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'user-agent': 'Mozilla/5.0 Chrome/120' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/analytics/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock.mockResolvedValue([])
  })

  it('records a page view', async () => {
    const res = await POST(trackRequest({ pathname: '/scholarships', session_id: 'abc' }))
    expect(res.status).toBe(200)
    expect(sqlMock).toHaveBeenCalled()
  })

  // The payload AnalyticsTracker actually sends: it uses `x || null` for
  // everything optional, so these arrive as null rather than absent. A schema
  // of z.string().optional() accepts undefined but rejects null, which 400'd
  // every single page view for four days in Sep 2026 while looking healthy
  // from the outside. Assert the real shape, not a convenient one.
  it('accepts the null-filled payload the browser tracker actually sends', async () => {
    const res = await POST(trackRequest({
      pathname: '/scholarships',
      referrer: null,
      session_id: 'abc',
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    }))
    expect(res.status).toBe(200)
    expect(sqlMock).toHaveBeenCalled()
  })

  it('ignores admin paths so staff activity does not pollute the numbers', async () => {
    const res = await POST(trackRequest({ pathname: '/admin/analytics' }))
    expect(res.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  // Regression guard: the insert once began referencing a column the database
  // did not have yet, and because the only caller ends its fetch in
  // `.catch(() => {})`, every page view silently stopped recording for days
  // with no error surfaced anywhere. A write failure must be logged.
  it('logs when the insert fails instead of failing silently', async () => {
    sqlMock.mockRejectedValueOnce(new Error('column "user_id" does not exist'))
    const res = await POST(trackRequest({ pathname: '/scholarships' }))
    expect(res.status).toBe(500)
    expect(logErrorMock).toHaveBeenCalledWith('analytics track', expect.any(Error))
  })
})
