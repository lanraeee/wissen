import { NextRequest } from 'next/server'

const sendMessageMock = vi.fn()
vi.mock('@/lib/telegram', () => ({
  botToken: () => process.env.TELEGRAM_BOT_TOKEN || undefined,
  sendMessage: (...a: unknown[]) => sendMessageMock(...a),
}))

const resolveActorMock = vi.fn()
const cmdStatsMock = vi.fn()
const cmdRunMock = vi.fn()
vi.mock('@/lib/telegram-commands', () => ({
  resolveActor: (...a: unknown[]) => resolveActorMock(...a),
  cmdStats: (...a: unknown[]) => cmdStatsMock(...a),
  cmdSubmissions: vi.fn(),
  cmdOpps: vi.fn(),
  cmdHealth: vi.fn(),
  cmdRun: (...a: unknown[]) => cmdRunMock(...a),
  cmdAsk: vi.fn(),
}))

import { POST } from './route'

const SECRET = 'test-secret-0123456789'
let nextUpdateId = 1

function update(text: string, opts: { fromId?: number; chatType?: string; secret?: string } = {}) {
  return new NextRequest('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers: { 'x-telegram-bot-api-secret-token': opts.secret ?? SECRET, 'content-type': 'application/json' },
    body: JSON.stringify({
      update_id: nextUpdateId++,
      message: {
        text,
        chat: { id: opts.fromId ?? 111, type: opts.chatType ?? 'private' },
        from: { id: opts.fromId ?? 111 },
      },
    }),
  })
}

describe('POST /api/telegram/webhook', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.TELEGRAM_BOT_TOKEN = 'token'
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET
    process.env.TELEGRAM_ADMINS = '111:admin@wissenhaus.org'
    delete process.env.TELEGRAM_BOT_USERNAME
  })

  it('returns 503 when the bot is not configured, including empty strings', async () => {
    process.env.TELEGRAM_BOT_TOKEN = ''
    const res = await POST(update('/stats'))
    expect(res.status).toBe(503)
  })

  it('rejects a request without the right secret header', async () => {
    const res = await POST(update('/stats', { secret: 'wrong-secret-0123456789' }))
    expect(res.status).toBe(401)
    expect(resolveActorMock).not.toHaveBeenCalled()
  })

  it('stays silent to accounts that are not linked', async () => {
    const res = await POST(update('/stats', { fromId: 999 }))
    expect(res.status).toBe(200)
    expect(sendMessageMock).not.toHaveBeenCalled()
    expect(cmdStatsMock).not.toHaveBeenCalled()
  })

  it('ignores group chats even from an admin', async () => {
    await POST(update('/stats', { chatType: 'group' }))
    expect(cmdStatsMock).not.toHaveBeenCalled()
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it('tells a linked account that lost admin access, and does nothing else', async () => {
    resolveActorMock.mockResolvedValue(null)
    await POST(update('/stats'))
    expect(resolveActorMock).toHaveBeenCalledWith(111, 'admin@wissenhaus.org')
    expect(cmdStatsMock).not.toHaveBeenCalled()
    expect(sendMessageMock.mock.calls[0][1]).toMatch(/no longer has admin access/)
  })

  it('runs a command for a live admin', async () => {
    resolveActorMock.mockResolvedValue({ id: 'u1', email: 'admin@wissenhaus.org', role: 'admin', telegramId: 111 })
    const res = await POST(update('/stats'))
    expect(res.status).toBe(200)
    expect(cmdStatsMock).toHaveBeenCalledWith(111)
  })

  it('hands /run to the background with its arguments', async () => {
    const actor = { id: 'u1', email: 'admin@wissenhaus.org', role: 'admin', telegramId: 111 }
    resolveActorMock.mockResolvedValue(actor)
    await POST(update('/run ledger'))
    expect(cmdRunMock).toHaveBeenCalledWith(111, actor, 'ledger')
  })

  it('does not process the same update twice', async () => {
    resolveActorMock.mockResolvedValue({ id: 'u1', email: 'admin@wissenhaus.org', role: 'admin', telegramId: 111 })
    const req = update('/stats')
    const body = await req.clone().text()
    const again = () => new NextRequest('http://localhost/api/telegram/webhook', {
      method: 'POST', headers: { 'x-telegram-bot-api-secret-token': SECRET }, body,
    })
    await POST(again())
    await POST(again())
    expect(cmdStatsMock).toHaveBeenCalledTimes(1)
  })

  it('answers /whoami for anyone only while no admin is linked', async () => {
    process.env.TELEGRAM_ADMINS = ''
    await POST(update('/whoami', { fromId: 555 }))
    expect(sendMessageMock.mock.calls[0][1]).toContain('555')

    sendMessageMock.mockReset()
    process.env.TELEGRAM_ADMINS = '111:admin@wissenhaus.org'
    await POST(update('/whoami', { fromId: 555 }))
    expect(sendMessageMock).not.toHaveBeenCalled()
  })
})
