import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }))

import { GET } from './route'

function req(qs: string) {
  return new NextRequest(`http://localhost/api/opportunities${qs}`)
}

// The route runs its page query and its count query through Promise.all, so
// each call answers rows first, then the count.
function respond(rows: unknown[], total: number) {
  sqlMock.mockResolvedValueOnce(rows).mockResolvedValueOnce([{ n: total }])
}

// The values actually bound into the SQL, in order, for the first query.
function boundValues() {
  return sqlMock.mock.calls[0].slice(1)
}

describe('GET /api/opportunities', () => {
  beforeEach(() => vi.clearAllMocks())

  it('defaults to a single page rather than the whole table', async () => {
    respond([{ id: 'a' }], 448)
    await GET(req(''))
    expect(boundValues()).toContain(12)
  })

  // limit is a public, unauthenticated input. Trusting it would let anyone ask
  // for the entire table in one request, which is the problem paging exists to
  // solve.
  it('clamps an oversized limit', async () => {
    respond([], 448)
    await GET(req('?limit=5000'))
    expect(boundValues()).toContain(48)
    expect(boundValues()).not.toContain(5000)
  })

  it('falls back to the default for a non-numeric limit', async () => {
    respond([], 10)
    await GET(req('?limit=abc'))
    expect(boundValues()).toContain(12)
  })

  it('never binds a negative offset', async () => {
    respond([], 10)
    await GET(req('?offset=-50'))
    expect(boundValues()).toContain(0)
    expect(boundValues()).not.toContain(-50)
  })

  it('reports hasMore while rows remain, and not on the last page', async () => {
    respond([{ id: 'a' }, { id: 'b' }], 5)
    let body = await (await GET(req('?limit=2&offset=0'))).json()
    expect(body).toMatchObject({ total: 5, hasMore: true })

    vi.clearAllMocks()
    respond([{ id: 'e' }], 5)
    body = await (await GET(req('?limit=2&offset=4'))).json()
    expect(body.hasMore).toBe(false)
  })

  it('answers empty rather than throwing when the query fails', async () => {
    sqlMock.mockRejectedValue(new Error('db down'))
    const res = await GET(req(''))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ opportunities: [], total: 0, hasMore: false })
  })
})
