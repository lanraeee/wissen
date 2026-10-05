import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const sendVerificationEmailMock = vi.fn()
vi.mock('@/lib/email', () => ({ sendVerificationEmail: (...args: unknown[]) => sendVerificationEmailMock(...args) }))

import { POST } from './route'

function resendRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sendVerificationEmailMock.mockResolvedValue(undefined)
    sqlMock.mockResolvedValue([])
  })

  it('emails a fresh link to an account that is still unconfirmed', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 'user-1', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' }])
    const res = await POST(resendRequest({ email: 'Ada@Example.com' }))
    expect(res.status).toBe(200)
    expect((sqlMock.mock.calls[0][0] as string[]).join('?')).toContain('email_verified_at IS NULL')
    expect(sqlMock.mock.calls[0][1]).toBe('ada@example.com')
    await new Promise(r => setTimeout(r, 0))
    expect(sendVerificationEmailMock).toHaveBeenCalledWith('ada@example.com', 'Ada Lovelace', expect.stringMatching(/\/verify-email\?token=/))
  })

  it('answers the same way when there is no pending account, and sends nothing', async () => {
    const res = await POST(resendRequest({ email: 'nobody@example.com' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    await new Promise(r => setTimeout(r, 0))
    expect(sendVerificationEmailMock).not.toHaveBeenCalled()
  })
})
