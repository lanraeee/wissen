const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const sendMessageMock = vi.fn()
vi.mock('@/lib/telegram', () => ({
  sendMessage: (...a: unknown[]) => sendMessageMock(...a),
  sendTyping: vi.fn(),
}))
vi.mock('@/lib/audit-log', () => ({ logActivity: vi.fn() }))
vi.mock('@/lib/admin-agent', () => ({ askAdminAgent: vi.fn() }))
vi.mock('@/lib/ai-settings', () => ({ canUseAdminAgent: vi.fn(), getAiSettings: vi.fn() }))

import { resolveActor, cmdRun } from './telegram-commands'
import { MASTER_ADMIN_EMAIL } from '@/lib/admin-guard'

describe('resolveActor', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([['admin'], ['editor']])('admits a live %s', async role => {
    sqlMock.mockResolvedValue([{ id: 'u1', email: 'a@x.com', role }])
    expect(await resolveActor(1, 'a@x.com')).toMatchObject({ id: 'u1', role, telegramId: 1 })
  })

  it.each([['trustee'], ['user']])('refuses a %s, matching adminGuard()', async role => {
    sqlMock.mockResolvedValue([{ id: 'u1', email: 'a@x.com', role }])
    expect(await resolveActor(1, 'a@x.com')).toBeNull()
  })

  it('admits the master admin whatever the stored role', async () => {
    sqlMock.mockResolvedValue([{ id: 'm', email: MASTER_ADMIN_EMAIL, role: 'user' }])
    expect(await resolveActor(1, MASTER_ADMIN_EMAIL)).not.toBeNull()
  })

  it('refuses a deleted account and a blocked one without querying', async () => {
    sqlMock.mockResolvedValue([])
    expect(await resolveActor(1, 'gone@x.com')).toBeNull()
    sqlMock.mockReset()
    expect(await resolveActor(1, 'director@wissenhaus.org')).toBeNull()
    expect(sqlMock).not.toHaveBeenCalled()
  })
})

describe('cmdRun', () => {
  beforeEach(() => vi.resetAllMocks())

  it('is director-only, like the admin panel job runner', async () => {
    await cmdRun(1, { id: 'u', email: 'admin@x.com', role: 'admin', telegramId: 1 }, 'ledger')
    expect(sendMessageMock.mock.calls[0][1]).toMatch(/Only the director/)
  })
})
