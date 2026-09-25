import { NextRequest } from 'next/server'

// lib/db's sql is a tagged-template function; mock it as a jest-style mock
// that resolves so the route's INSERT doesn't hit a real database.
vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/email', () => ({
  sendContactNotification: vi.fn().mockResolvedValue(undefined),
  sendContactConfirmation: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from './route'
import { sendContactNotification, sendContactConfirmation } from '@/lib/email'

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { name: 'Ada Lovelace', email: 'ada@example.com', subject: 'Hello', message: 'Hi there' }

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts a valid submission and sends both emails', async () => {
    const res = await POST(jsonRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true })
    expect(sendContactNotification).toHaveBeenCalledWith(VALID_BODY)
    expect(sendContactConfirmation).toHaveBeenCalledWith(VALID_BODY.email, VALID_BODY.name)
  })

  it('rejects a submission missing required fields with 400, no emails sent', async () => {
    const res = await POST(jsonRequest({ name: 'Ada' }))
    expect(res.status).toBe(400)
    expect(sendContactNotification).not.toHaveBeenCalled()
    expect(sendContactConfirmation).not.toHaveBeenCalled()
  })

  it('rejects an invalid email address', async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('rejects an over-length message', async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, message: 'x'.repeat(5001) }))
    expect(res.status).toBe(400)
  })

  it('still returns success if email sending throws (best-effort)', async () => {
    vi.mocked(sendContactNotification).mockRejectedValueOnce(new Error('resend down'))
    const res = await POST(jsonRequest(VALID_BODY))
    expect(res.status).toBe(200)
  })
})
