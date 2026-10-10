const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const sendMessageMock = vi.fn()
vi.mock('@/lib/telegram', () => ({ sendMessage: (...a: unknown[]) => sendMessageMock(...a) }))

const resolveActorMock = vi.fn()
vi.mock('@/lib/telegram-commands', () => ({ resolveActor: (...a: unknown[]) => resolveActorMock(...a) }))

const getAiSettingsMock = vi.fn()
vi.mock('@/lib/ai-settings', () => ({ getAiSettings: (...a: unknown[]) => getAiSettingsMock(...a) }))
vi.mock('@/lib/ai-provider', () => ({ resolveProvider: () => null }))

import { buildDigest, sendDigest } from './telegram-digest'

describe('buildDigest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getAiSettingsMock.mockResolvedValue({ provider: 'anthropic' })
    sqlMock.mockResolvedValue([{ c: 3, updated: new Date().toISOString() }])
  })

  it('reports counts only, with no names, emails or message text', async () => {
    sqlMock.mockResolvedValueOnce([{ c: 4 }]) // users
    const text = await buildDigest(new Date())
    expect(text).toContain('Sign-ups: 4')
    expect(text).toMatch(/last 6 hours/)
    expect(text).not.toMatch(/@/)
  })

  it('shows "unavailable" for a failing query instead of failing the digest', async () => {
    sqlMock.mockRejectedValue(new Error('relation does not exist'))
    const text = await buildDigest(new Date())
    expect(text).toContain('Sign-ups: unavailable')
    expect(text).toContain('Opportunities')
  })

  it('escapes HTML in interpolated values', async () => {
    const text = await buildDigest(new Date())
    expect(text).not.toMatch(/<script/)
  })
})

describe('sendDigest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getAiSettingsMock.mockResolvedValue({ provider: 'anthropic' })
    sqlMock.mockResolvedValue([{ c: 0, updated: null }])
    delete process.env.TELEGRAM_ADMINS
  })

  it('sends nothing when no admins are linked', async () => {
    expect(await sendDigest()).toEqual({ recipients: 0, skipped: 0 })
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it('sends to live admins and skips accounts that lost access', async () => {
    process.env.TELEGRAM_ADMINS = '111:admin@x.com,222:gone@x.com'
    resolveActorMock
      .mockResolvedValueOnce({ id: 'u1', email: 'admin@x.com', role: 'admin', telegramId: 111 })
      .mockResolvedValueOnce(null)
    expect(await sendDigest()).toEqual({ recipients: 1, skipped: 1 })
    expect(sendMessageMock).toHaveBeenCalledTimes(1)
    expect(sendMessageMock.mock.calls[0][0]).toBe(111)
  })
})
