import { NextRequest } from 'next/server'
import crypto from 'crypto'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const sendWelcomeEmailMock = vi.fn()
vi.mock('@/lib/email', () => ({ sendWelcomeEmail: (...args: unknown[]) => sendWelcomeEmailMock(...args) }))

import { POST } from './route'

function verifyRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const USER_ROW = { email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace', newly_verified: true }

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sendWelcomeEmailMock.mockResolvedValue(undefined)
    sqlMock.mockResolvedValue([])
  })

  it('claims the token by its hash, confirms the user and sends the welcome email once', async () => {
    sqlMock.mockResolvedValueOnce([{ user_id: 'user-1' }]).mockResolvedValueOnce([USER_ROW])
    const res = await POST(verifyRequest({ token: 'abc123' }))
    expect(res.status).toBe(200)
    expect((await res.json()).email).toBe('ada@example.com')

    const claim = sqlMock.mock.calls[0]
    expect((claim[0] as string[]).join('?')).toContain('used_at IS NULL AND expires_at > NOW()')
    expect(claim[1]).toBe(crypto.createHash('sha256').update('abc123').digest('hex'))
    expect(claim).not.toContain('abc123')

    const confirm = sqlMock.mock.calls[1]
    expect((confirm[0] as string[]).join('?')).toContain('email_verified_at')

    await new Promise(r => setTimeout(r, 0))
    expect(sendWelcomeEmailMock).toHaveBeenCalledWith('ada@example.com', 'Ada Lovelace')
  })

  it('does not resend the welcome email when the address was already confirmed', async () => {
    sqlMock.mockResolvedValueOnce([{ user_id: 'user-1' }]).mockResolvedValueOnce([{ ...USER_ROW, newly_verified: false }])
    const res = await POST(verifyRequest({ token: 'abc123' }))
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 0))
    expect(sendWelcomeEmailMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown, expired or spent token without touching the user', async () => {
    sqlMock.mockResolvedValueOnce([])
    const res = await POST(verifyRequest({ token: 'nope' }))
    expect(res.status).toBe(400)
    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(sendWelcomeEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a request with no token', async () => {
    const res = await POST(verifyRequest({}))
    expect(res.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
