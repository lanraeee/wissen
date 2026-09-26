const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

import { recordVisit } from './streak'

describe('recordVisit', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns the streak_count from the upsert result', async () => {
    sqlMock.mockResolvedValueOnce([{ streak_count: 4 }])
    const result = await recordVisit('user-1')
    expect(result).toBe(4)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to 1 if the query unexpectedly returns no row', async () => {
    sqlMock.mockResolvedValueOnce([])
    const result = await recordVisit('user-1')
    expect(result).toBe(1)
  })
})
