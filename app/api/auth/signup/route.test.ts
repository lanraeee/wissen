import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const hashPasswordMock = vi.fn()
const signTokenMock = vi.fn()
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    hashPassword: (...args: unknown[]) => hashPasswordMock(...args),
    signToken: (...args: unknown[]) => signTokenMock(...args),
  }
})

const sendWelcomeEmailMock = vi.fn()
vi.mock('@/lib/email', () => ({ sendWelcomeEmail: (...args: unknown[]) => sendWelcomeEmailMock(...args) }))

import { POST } from './route'

function signupRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', password: 'a-strong-password' }
const INSERTED_USER = { id: 'user-1', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace', membership_expiry: null }

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashPasswordMock.mockResolvedValue('hashed-password')
    signTokenMock.mockResolvedValue('signed.jwt.token')
    sendWelcomeEmailMock.mockResolvedValue(undefined)
  })

  it('creates a new account and sets the session cookie', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([INSERTED_USER]) // no existing user, then the INSERT...RETURNING
    const res = await POST(signupRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toEqual({ id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace' })
    expect(res.cookies.get('wh_token')?.value).toBe('signed.jwt.token')
    expect(sendWelcomeEmailMock).toHaveBeenCalledWith('ada@example.com', 'Ada Lovelace')
  })

  it('rejects a duplicate email with 409, without hashing a password or signing a token', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 'existing-user' }])
    const res = await POST(signupRequest(VALID_BODY))
    expect(res.status).toBe(409)
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(signTokenMock).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', async () => {
    const res = await POST(signupRequest({ ...VALID_BODY, password: 'short' }))
    expect(res.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email format', async () => {
    const res = await POST(signupRequest({ ...VALID_BODY, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('rejects a missing name field', async () => {
    const res = await POST(signupRequest({ ...VALID_BODY, firstName: undefined }))
    expect(res.status).toBe(400)
  })

  it('still succeeds even if the welcome email fails (non-blocking)', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([INSERTED_USER])
    sendWelcomeEmailMock.mockRejectedValueOnce(new Error('resend down'))
    const res = await POST(signupRequest(VALID_BODY))
    expect(res.status).toBe(200)
  })
})
