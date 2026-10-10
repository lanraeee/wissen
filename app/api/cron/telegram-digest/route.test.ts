import { NextRequest } from 'next/server'

const sendDigestMock = vi.fn()
vi.mock('@/lib/telegram-digest', () => ({ sendDigest: (...a: unknown[]) => sendDigestMock(...a) }))

import { POST } from './route'

const SECRET = 'cron-secret-for-tests-0123'

function req(auth?: string) {
  return new NextRequest('http://localhost/api/cron/telegram-digest', {
    method: 'POST',
    headers: auth === undefined ? {} : { authorization: auth },
  })
}

describe('POST /api/cron/telegram-digest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.CRON_SECRET = SECRET
    process.env.TELEGRAM_BOT_TOKEN = 'token'
    process.env.TELEGRAM_WEBHOOK_SECRET = 'webhook-secret-0123456789'
  })

  it('rejects a missing or wrong bearer secret', async () => {
    expect((await POST(req())).status).toBe(401)
    expect((await POST(req('Bearer nope'))).status).toBe(401)
    expect(sendDigestMock).not.toHaveBeenCalled()
  })

  it('refuses when CRON_SECRET is empty, even if the header is empty too', async () => {
    process.env.CRON_SECRET = ''
    expect((await POST(req('Bearer '))).status).toBe(401)
  })

  it('returns 503 when the bot is not configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = ''
    expect((await POST(req(`Bearer ${SECRET}`))).status).toBe(503)
    expect(sendDigestMock).not.toHaveBeenCalled()
  })

  it('sends the digest for a valid secret and reports recipients', async () => {
    sendDigestMock.mockResolvedValue({ recipients: 2, skipped: 1 })
    const res = await POST(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, recipients: 2, skipped: 1 })
  })

  it('returns 500 without leaking the error when sending fails', async () => {
    sendDigestMock.mockRejectedValue(new Error('db password=hunter2'))
    const res = await POST(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('hunter2')
  })
})
