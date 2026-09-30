import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const adminGuardMock = vi.fn()
const directorGuardMock = vi.fn()
const adminRoleMock = vi.fn()
vi.mock('@/lib/admin-guard', () => ({
  adminGuard: () => adminGuardMock(),
  directorGuard: () => directorGuardMock(),
  adminRole: () => adminRoleMock(),
}))

const writeContentMock = vi.fn()
vi.mock('@/lib/content-approvals', () => ({ writeContent: (...a: unknown[]) => writeContentMock(...a) }))

vi.mock('@/lib/audit-log', () => ({ logActivity: vi.fn() }))

import { PUT } from './route'

const EDITOR = { id: 'e-1', email: 'editor@wissenhaus.org', role: 'editor' }
const DIRECTOR = { id: 'd-1', email: 'director@wissenhaus.org', role: 'admin' }

function putRequest(value: unknown) {
  return new NextRequest('http://localhost/api/admin/content/page_copy_about', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
}

const params = (key: string) => ({ params: Promise.resolve({ key }) })

describe('PUT /api/admin/content/[key]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock.mockResolvedValue([])
  })

  // The whole point of the approval queue: an editor's save must never reach
  // site_content. If writeContent is ever called on this path, editor changes
  // are going live unreviewed.
  it('queues an editor change instead of publishing it', async () => {
    adminGuardMock.mockResolvedValue(EDITOR)
    adminRoleMock.mockResolvedValue('editor')

    const res = await PUT(putRequest({ heading: 'New heading' }), params('page_copy_about'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, pending: true })
    expect(writeContentMock).not.toHaveBeenCalled()
    // the SELECT of the current value, then the INSERT of the proposal
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it('publishes a director change directly', async () => {
    adminGuardMock.mockResolvedValue(DIRECTOR)
    adminRoleMock.mockResolvedValue('director')

    const res = await PUT(putRequest({ heading: 'New heading' }), params('page_copy_about'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(writeContentMock).toHaveBeenCalledWith('page_copy_about', { heading: 'New heading' })
  })

  it('publishes an admin change directly', async () => {
    adminGuardMock.mockResolvedValue({ id: 'a-1', email: 'admin@x.com', role: 'admin' })
    adminRoleMock.mockResolvedValue('admin')

    await PUT(putRequest({ heading: 'x' }), params('page_copy_about'))

    expect(writeContentMock).toHaveBeenCalled()
  })

  // bank_transfer_details decides which account donors are told to pay into.
  // It is director-only at the guard, so an editor must not even reach the
  // approval queue with it -- a queued proposal is still a proposal a tired
  // director might wave through.
  it('refuses an editor outright on bank_transfer_details', async () => {
    directorGuardMock.mockResolvedValue(null)
    adminRoleMock.mockResolvedValue('editor')

    const res = await PUT(putRequest({ accountNumber: '0000000000' }), params('bank_transfer_details'))

    expect(res.status).toBe(403)
    expect(writeContentMock).not.toHaveBeenCalled()
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
