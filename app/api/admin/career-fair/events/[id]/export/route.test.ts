import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({ adminGuard: () => adminGuardMock() }))

import { GET } from './route'

function ctx(id = '1') {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/admin/career-fair/events/[id]/export', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 403 when not staff', async () => {
    adminGuardMock.mockResolvedValue(null)
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown event', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a', email: 'a@x.com', role: 'admin' })
    sqlMock.mockResolvedValueOnce([])
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(404)
  })

  it('produces a CSV with a header row and one row per registrant, quoting commas', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a', email: 'a@x.com', role: 'admin' })
    sqlMock.mockResolvedValueOnce([{ slug: 'ibadan-2026', title: 'Ibadan Fair' }]).mockResolvedValueOnce([
      { name: 'Ada, Lovelace', email: 'ada@example.com', phone: null, school: 'IGS', class_grade: 'SS2', career_interest: 'Technology', newsletter_opt_in: true, checked_in: false, checked_in_at: null, created_at: '2026-01-01' },
    ])
    const res = await GET({} as NextRequest, ctx())
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain('ibadan-2026-registrations.csv')
    const text = await res.text()
    const lines = text.split('\n')
    expect(lines[0]).toBe('Name,Email,Phone,School,Class/Grade,Career Interest,Newsletter Opt-In,Checked In,Checked In At,Registered At')
    expect(lines[1]).toContain('"Ada, Lovelace"')
  })
})
