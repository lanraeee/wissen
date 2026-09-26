import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

const logActivityMock = vi.fn()
vi.mock('@/lib/audit-log', () => ({ logActivity: (...args: unknown[]) => logActivityMock(...args) }))

const sendReminderMock = vi.fn()
vi.mock('@/lib/email', () => ({ sendFairCheckinReminder: (...args: unknown[]) => sendReminderMock(...args) }))

import { POST } from './route'

const SESSION = { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
const EVENT = { title: 'Ibadan Fair', location: 'Ibadan', event_date: '2026-11-01', event_time: '9am' }

function ctx(id = '1') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/admin/career-fair/events/[id]/send-reminders', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await POST({} as NextRequest, ctx())
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown event', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([])
    const res = await POST({} as NextRequest, ctx())
    expect(res.status).toBe(404)
  })

  it('sends reminders to not-yet-checked-in registrants and logs the count', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([EVENT]).mockResolvedValueOnce([
      { name: 'Ada', email: 'ada@example.com', checkin_token: 'tok1' },
      { name: 'Bo', email: 'bo@example.com', checkin_token: 'tok2' },
    ])
    sendReminderMock.mockResolvedValue(undefined)
    const res = await POST({} as NextRequest, ctx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ sent: 2, failed: 0 })
    expect(sendReminderMock).toHaveBeenCalledTimes(2)
    expect(logActivityMock).toHaveBeenCalledWith(SESSION, 'fair_event.send_reminders', expect.objectContaining({ details: { sent: 2, failed: 0 } }))
  })

  it('counts failed sends separately without failing the request', async () => {
    adminGuardMock.mockResolvedValue(SESSION)
    sqlMock.mockResolvedValueOnce([EVENT]).mockResolvedValueOnce([
      { name: 'Ada', email: 'ada@example.com', checkin_token: 'tok1' },
    ])
    sendReminderMock.mockRejectedValue(new Error('send failed'))
    const res = await POST({} as NextRequest, ctx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ sent: 0, failed: 1 })
  })
})
