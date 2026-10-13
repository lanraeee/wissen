const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const guardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({
  userAdminGuard: () => guardMock(),
  isDirector: (email?: string) => email === 'wissenhaus@outlook.com',
  isMasterAdmin: (email?: string) => email === 'wissenhaus@outlook.com',
  isBlockedAdmin: (email?: string) => email === 'director@wissenhaus.org',
}))

const verifyPasswordMock = vi.fn()
vi.mock('@/lib/auth', () => ({ verifyPassword: (...a: unknown[]) => verifyPasswordMock(...a) }))

const logRequiredMock = vi.fn()
vi.mock('@/lib/audit-log', () => ({ logActivityRequired: (...a: unknown[]) => logRequiredMock(...a) }))

const cookieStore = { get: vi.fn() }
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

import { NextRequest } from 'next/server'
import { POST } from './route'

const VIEWER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '22222222-2222-4222-8222-222222222222'
const reason = 'Member cannot open their certificate page'

function req(body: unknown) {
  return new NextRequest('https://www.wissenhaus.org/api/admin/view-as', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// First SELECT is the viewer's password hash; second is the target row.
function mockRows(target: Record<string, unknown> | null) {
  sqlMock
    .mockResolvedValueOnce([{ password_hash: 'hash' }])
    .mockResolvedValueOnce(target ? [target] : [])
}

describe('POST /api/admin/view-as', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long'
    vi.resetAllMocks()
    cookieStore.get.mockReturnValue(undefined)
    verifyPasswordMock.mockResolvedValue(true)
    logRequiredMock.mockResolvedValue(undefined)
  })

  it('refuses when the caller is not an admin or director', async () => {
    guardMock.mockResolvedValue(null)
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('refuses when a view is already active', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    const { signViewAs } = await import('@/lib/view-as-shared')
    cookieStore.get.mockReturnValue({ value: await signViewAs({
      id: MEMBER_ID, email: 'm@example.com', name: 'M', role: 'user', viewer: { id: VIEWER_ID, email: 'admin@example.com', role: 'admin' },
    }) })
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(409)
  })

  it('requires a reason of at least 10 characters', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    const res = await POST(req({ userId: MEMBER_ID, reason: 'short', password: 'pw' }))
    expect(res.status).toBe(400)
    expect(logRequiredMock).not.toHaveBeenCalled()
  })

  it('refuses a wrong password and starts nothing', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    mockRows(null)
    verifyPasswordMock.mockResolvedValue(false)
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'wrong' }))
    expect(res.status).toBe(403)
    expect(logRequiredMock).not.toHaveBeenCalled()
    expect(res.cookies.get('wh_view_as')).toBeUndefined()
  })

  it('refuses staff accounts as the target', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'ed@example.com', first_name: 'E', last_name: 'D', role: 'editor', membership_expiry: null })
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(403)
    expect(logRequiredMock).not.toHaveBeenCalled()
  })

  it('refuses the master admin account as the target', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'wissenhaus@outlook.com', first_name: 'W', last_name: 'H', role: 'user', membership_expiry: null })
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(403)
  })

  it('does not start the view when the audit row cannot be written', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'm@example.com', first_name: 'M', last_name: 'Ember', role: 'user', membership_expiry: null })
    logRequiredMock.mockRejectedValue(new Error('db down'))
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(500)
    expect(res.cookies.get('wh_view_as')).toBeUndefined()
  })

  it('records the reason, then sets a read-only, 30-minute member cookie', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'm@example.com', first_name: 'Ada', last_name: 'Lovelace', role: 'user', membership_expiry: null })
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(200)

    expect(logRequiredMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: VIEWER_ID }),
      'user.view_as.start',
      expect.objectContaining({ targetId: MEMBER_ID, details: expect.objectContaining({ reason }) }),
    )

    const cookie = res.cookies.get('wh_view_as')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.maxAge).toBe(30 * 60)
    const meta = res.cookies.get('wh_view_as_meta')
    expect(meta?.httpOnly).toBeFalsy()
  })

  it('lets the master admin start a view with no reason, and writes no audit row', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'wissenhaus@outlook.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'm@example.com', first_name: 'Ada', last_name: 'Lovelace', role: 'user', membership_expiry: null })
    const res = await POST(req({ userId: MEMBER_ID, password: 'pw' }))
    expect(res.status).toBe(200)
    expect(logRequiredMock).not.toHaveBeenCalled()
    expect(res.cookies.get('wh_view_as')?.httpOnly).toBe(true)
  })

  it('lets the master admin view an editor account', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'wissenhaus@outlook.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'ed@example.com', first_name: 'E', last_name: 'D', role: 'editor', membership_expiry: null })
    const res = await POST(req({ userId: MEMBER_ID, password: 'pw' }))
    expect(res.status).toBe(200)
  })

  it('still refuses a staff account for a non-master admin', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    mockRows({ id: MEMBER_ID, email: 'ed@example.com', first_name: 'E', last_name: 'D', role: 'editor', membership_expiry: null })
    const res = await POST(req({ userId: MEMBER_ID, reason, password: 'pw' }))
    expect(res.status).toBe(403)
  })

  it('still requires a reason from a non-master admin', async () => {
    guardMock.mockResolvedValue({ id: VIEWER_ID, email: 'admin@example.com', role: 'admin' })
    const res = await POST(req({ userId: MEMBER_ID, password: 'pw' }))
    expect(res.status).toBe(400)
    expect(logRequiredMock).not.toHaveBeenCalled()
  })
})
