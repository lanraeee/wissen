import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const verifyPasswordMock = vi.fn()
const signTokenMock = vi.fn()
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args),
    signToken: (...args: unknown[]) => signTokenMock(...args),
  }
})

import { POST } from './route'

function loginRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const DB_USER = {
  id: 'user-1',
  email: 'ada@example.com',
  password_hash: 'hashed',
  first_name: 'Ada',
  last_name: 'Lovelace',
  membership_expiry: null,
  role: 'user',
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signTokenMock.mockResolvedValue('signed.jwt.token')
    // First call: SELECT user. Second call: visit_streaks upsert.
    sqlMock.mockResolvedValueOnce([DB_USER]).mockResolvedValueOnce([])
  })

  it('logs in with valid credentials and sets the session cookie', async () => {
    verifyPasswordMock.mockResolvedValue(true)
    const res = await POST(loginRequest({ email: 'ada@example.com', password: 'correct-password' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.user).toEqual({ id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace' })
    expect(res.cookies.get('wh_token')?.value).toBe('signed.jwt.token')
  })

  it('rejects an unknown email with a generic 401 (no user enumeration)', async () => {
    sqlMock.mockReset().mockResolvedValueOnce([]) // no user row found
    const res = await POST(loginRequest({ email: 'nobody@example.com', password: 'whatever' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid email or password')
    expect(signTokenMock).not.toHaveBeenCalled()
  })

  it('rejects a wrong password with the same generic 401', async () => {
    verifyPasswordMock.mockResolvedValue(false)
    const res = await POST(loginRequest({ email: 'ada@example.com', password: 'wrong-password' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid email or password')
    expect(signTokenMock).not.toHaveBeenCalled()
  })

  it('rejects a request missing the password field', async () => {
    const res = await POST(loginRequest({ email: 'ada@example.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 rather than leaking an internal error on unexpected failure', async () => {
    sqlMock.mockReset().mockRejectedValueOnce(new Error('connection refused'))
    const res = await POST(loginRequest({ email: 'ada@example.com', password: 'x' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Server error')
  })
})
