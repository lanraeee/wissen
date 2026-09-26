import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const sendConfirmationMock = vi.fn()
const sendNotificationMock = vi.fn()
vi.mock('@/lib/email', () => ({
  sendFairRegistrationConfirmation: (...args: unknown[]) => sendConfirmationMock(...args),
  sendFairRegistrationNotification: (...args: unknown[]) => sendNotificationMock(...args),
}))

import { POST } from './route'

function req(body: unknown) {
  return new NextRequest('http://localhost/api/career-fair/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const EVENT = {
  id: 1, slug: 'ibadan-2026', title: 'Career Clarity Fair — Ibadan',
  school: 'Ibadan Grammar School', location: 'Ibadan', event_date: '2026-11-01', event_time: '9am',
  booths: [{ id: 'b1', name: 'Tech Corner', category: 'Technology' }],
}

const VALID_BODY = {
  eventId: 1, name: 'Ada Lovelace', email: 'ada@example.com', phone: '08012345678',
  school: 'Ibadan Grammar School', classGrade: 'SS2', careerInterest: 'Technology', newsletterOptIn: true,
}

describe('POST /api/career-fair/register', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sendConfirmationMock.mockResolvedValue(undefined)
    sendNotificationMock.mockResolvedValue(undefined)
  })

  it('registers successfully, recommends the matching booth, and emails both parties', async () => {
    sqlMock.mockResolvedValueOnce([EVENT]).mockResolvedValueOnce([{ id: 'reg-1' }])
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.recommendedBooths).toEqual([EVENT.booths[0]])
    expect(sendConfirmationMock).toHaveBeenCalledTimes(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('rejects registration for an event that does not exist or is not published', async () => {
    sqlMock.mockResolvedValueOnce([]) // no event row (unpublished/unknown id both look like this)
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(404)
    expect(sendConfirmationMock).not.toHaveBeenCalled()
  })

  it('rejects a missing required field', async () => {
    const { school, ...withoutSchool } = VALID_BODY
    const res = await POST(req(withoutSchool))
    expect(res.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email', async () => {
    const res = await POST(req({ ...VALID_BODY, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('rejects a careerInterest value outside the fixed list', async () => {
    const res = await POST(req({ ...VALID_BODY, careerInterest: 'Astrology' }))
    expect(res.status).toBe(400)
  })

  it('returns 502 rather than a raw error if the insert fails', async () => {
    sqlMock.mockResolvedValueOnce([EVENT]).mockRejectedValueOnce(new Error('db down'))
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(502)
  })

  it('still succeeds without an assessment snapshot, using only the explicit interest', async () => {
    const { careerInterest, ...withoutInterest } = VALID_BODY
    sqlMock.mockResolvedValueOnce([EVENT]).mockResolvedValueOnce([{ id: 'reg-2' }])
    const res = await POST(req(withoutInterest))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.recommendedBooths).toEqual([])
  })
})
