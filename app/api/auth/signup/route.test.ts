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

const sendVerificationEmailMock = vi.fn()
const sendWelcomeEmailMock = vi.fn()
vi.mock('@/lib/email', () => ({
  sendVerificationEmail: (...args: unknown[]) => sendVerificationEmailMock(...args),
  sendWelcomeEmail: (...args: unknown[]) => sendWelcomeEmailMock(...args),
}))

import { POST } from './route'

function signupRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', password: 'a-strong-password' }
const INSERTED_USER = { id: 'user-1', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' }

function sqlText(call: unknown[]) {
  return (call[0] as string[]).join('?')
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    hashPasswordMock.mockResolvedValue('hashed-password')
    signTokenMock.mockResolvedValue('signed.jwt.token')
    sendVerificationEmailMock.mockResolvedValue(undefined)
    sqlMock.mockResolvedValue([])
  })

  it('creates an unconfirmed account and emails a confirmation link instead of signing in', async () => {
    // no existing user, then the INSERT...RETURNING, then the token insert
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([INSERTED_USER])
    const res = await POST(signupRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.verificationRequired).toBe(true)
    expect(body.user).toEqual({ id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace' })
    expect(res.cookies.get('wh_token')).toBeUndefined()
    expect(signTokenMock).not.toHaveBeenCalled()

    const insertUser = sqlMock.mock.calls.find(c => sqlText(c).includes('INSERT INTO users'))!
    expect(sqlText(insertUser)).toContain('email_verified_at')
    expect(sqlText(insertUser)).toContain('NULL')

    const insertToken = sqlMock.mock.calls.find(c => sqlText(c).includes('email_verification_tokens'))!
    expect(insertToken).toBeDefined()
    expect(insertToken[1]).toBe('user-1')

    await new Promise(r => setTimeout(r, 0))
    expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1)
    const [to, name, url] = sendVerificationEmailMock.mock.calls[0]
    expect(to).toBe('ada@example.com')
    expect(name).toBe('Ada Lovelace')
    expect(url).toMatch(/\/verify-email\?token=[0-9a-f]{64}$/)
    // Only the hash is stored, never the token in the link.
    const token = (url as string).split('token=')[1]
    expect(insertToken).not.toContain(token)
    expect(sendWelcomeEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a duplicate email with 409, without hashing a password or signing a token', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 'existing-user' }])
    const res = await POST(signupRequest(VALID_BODY))
    expect(res.status).toBe(409)
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(signTokenMock).not.toHaveBeenCalled()
    expect(sendVerificationEmailMock).not.toHaveBeenCalled()
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

  it('still succeeds even if the confirmation email fails (non-blocking)', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([INSERTED_USER])
    sendVerificationEmailMock.mockRejectedValueOnce(new Error('resend down'))
    const res = await POST(signupRequest(VALID_BODY))
    expect(res.status).toBe(200)
  })
})
