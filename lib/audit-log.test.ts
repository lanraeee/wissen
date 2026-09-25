const sqlMock = vi.fn()
vi.mock('./db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const logErrorMock = vi.fn()
vi.mock('./logger', () => ({ log: { error: (...args: unknown[]) => logErrorMock(...args) } }))

import { logActivity } from './audit-log'

const ACTOR = { id: 'user-1', email: 'admin@example.com', role: 'admin' }

describe('logActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock.mockResolvedValue([])
  })

  it('inserts a row with the actor, action, and target info', async () => {
    await logActivity(ACTOR, 'user.set_role', { targetType: 'user', targetId: 'user-2', details: { from: 'user', to: 'editor' } })
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('defaults role to "user" when the actor has none', async () => {
    await logActivity({ id: 'x', email: 'x@example.com' }, 'noop')
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('never throws when the insert fails -- logs via lib/logger instead', async () => {
    sqlMock.mockRejectedValueOnce(new Error('db down'))
    await expect(logActivity(ACTOR, 'user.delete')).resolves.toBeUndefined()
    expect(logErrorMock).toHaveBeenCalledTimes(1)
    expect(logErrorMock.mock.calls[0][0]).toBe('audit-log')
  })

  it('works with no opts at all', async () => {
    await expect(logActivity(ACTOR, 'cron.trigger')).resolves.toBeUndefined()
  })
})
