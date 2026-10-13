const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
const trusteeGuardMock = vi.fn()
const canSafeguardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({
  adminGuard: () => adminGuardMock(),
  trusteeSectionsGuard: () => trusteeGuardMock(),
  canAccessSafeguarding: (email?: string) => canSafeguardMock(email),
}))

import { GET } from './route'

// Order of the sql calls in route.ts: the eight triage queues, then donations,
// monthly giving, career fair, testimonials, and safeguarding (last, only when
// the viewer may see it).
const BASE_COUNTS = [2, 1, 0, 3, 5, 4, 6, 2, 7, 1, 3, 8]

describe('GET /api/admin/inbox-counts', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    trusteeGuardMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns counts per resource, including the new badges', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a', email: 'a@x.com', role: 'admin' })
    canSafeguardMock.mockResolvedValue(false)
    for (const c of BASE_COUNTS) sqlMock.mockResolvedValueOnce([{ c }])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      contact: 2, volunteer: 1, partner: 0, bank_transfer: 3, scholarship: 5,
      content_approval: 4, support: 6, kb_pending: 2,
      donations: 7, giving: 1, career_fair: 3, testimonials: 8,
      // Hidden from roles without the safeguarding team: never queried, reported as 0.
      safeguarding: 0,
    })
    expect(sqlMock).toHaveBeenCalledTimes(12)
  })

  it('shows the safeguarding count to someone who may see it', async () => {
    adminGuardMock.mockResolvedValue({ id: 'd', email: 'director@x.com', role: 'admin' })
    canSafeguardMock.mockResolvedValue(true)
    for (const c of [...BASE_COUNTS, 4]) sqlMock.mockResolvedValueOnce([{ c }])
    const body = await (await GET()).json()
    expect(body.safeguarding).toBe(4)
    expect(sqlMock).toHaveBeenCalledTimes(13)
  })

  it('hides sections a trustee has no grant for, including safeguarding', async () => {
    adminGuardMock.mockResolvedValue(null)
    trusteeGuardMock.mockResolvedValue({ session: { id: 't' }, sections: ['donations'] })
    canSafeguardMock.mockResolvedValue(false)
    for (const c of BASE_COUNTS) sqlMock.mockResolvedValueOnce([{ c }])
    const body = await (await GET()).json()
    expect(body.donations).toBe(7)
    expect(body.contact).toBe(0)
    expect(body.testimonials).toBe(0)
    expect(body.safeguarding).toBe(0)
  })
})
