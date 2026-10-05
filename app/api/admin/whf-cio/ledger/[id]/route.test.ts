import { NextRequest } from 'next/server'

const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...a: unknown[]) => sqlMock(...a) }))
vi.mock('@/lib/admin-guard', () => ({ directorGuard: vi.fn().mockResolvedValue({ id: 'u1', email: 'director@wissenhaus.org' }) }))
vi.mock('@/lib/audit-log', () => ({ logActivity: vi.fn() }))

import { PUT, DELETE } from './route'
import { logActivity } from '@/lib/audit-log'

const ID = '11111111-1111-4111-8111-111111111111'
const ctx = { params: Promise.resolve({ id: ID }) }
const synced = {
  id: ID, source: 'tide', occurred_on: '2026-09-30', direction: 'in', amount: '50.00', currency: 'GBP',
  description: 'Bank receipt', category: null, counterparty: 'J BLOGGS', account_label: 'Tide', is_transfer: false,
  is_public: true, excluded: false, original: null,
}

function put(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/whf-cio/ledger/${ID}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('PUT /api/admin/whf-cio/ledger/[id]', () => {
  beforeEach(() => { sqlMock.mockReset(); vi.mocked(logActivity).mockClear() })

  it('refuses to override a bank-synced entry without a reason', async () => {
    sqlMock.mockResolvedValueOnce([synced])
    const res = await PUT(put({ description: 'Grant from X Trust' }), ctx)
    expect(res.status).toBe(400)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('records an override: marks it, keeps the original, and logs before/after', async () => {
    sqlMock.mockResolvedValueOnce([synced]).mockResolvedValueOnce([{ ...synced, description: 'Grant from X Trust', overridden: true }])
    const res = await PUT(put({ description: 'Grant from X Trust', category: 'grant', override_reason: 'Bank reference unclear' }), ctx)
    expect(res.status).toBe(200)

    // Only the fields sent are touched: counterparty and account_label stay as they were.
    const [text, params] = sqlMock.mock.calls[1] as [string, unknown[]]
    expect(text).toMatch(/^UPDATE cio_ledger_entries SET description = \$1, category = \$2, overridden = \$3, override_reason = \$4, original = \$5, updated_by = \$6/)
    expect(params[2]).toBe(true)
    expect(JSON.parse(params[4] as string)).toMatchObject({ description: 'Bank receipt', counterparty: 'J BLOGGS' })

    expect(logActivity).toHaveBeenCalledWith(expect.anything(), 'whf_cio.ledger.override', expect.objectContaining({
      details: expect.objectContaining({
        reason: 'Bank reference unclear',
        changes: { description: { from: 'Bank receipt', to: 'Grant from X Trust' }, category: { from: null, to: 'grant' } },
      }),
    }))
  })

  it('edits a manual entry without needing a reason', async () => {
    const manual = { ...synced, source: 'manual' }
    sqlMock.mockResolvedValueOnce([manual]).mockResolvedValueOnce([{ ...manual, amount: '60.00' }])
    const res = await PUT(put({ amount: 60 }), ctx)
    expect(res.status).toBe(200)
    expect(sqlMock.mock.calls[1][0]).not.toContain('overridden')
  })
})

describe('DELETE /api/admin/whf-cio/ledger/[id]', () => {
  beforeEach(() => sqlMock.mockReset())

  it('will not delete a synced entry', async () => {
    sqlMock.mockResolvedValueOnce([{ source: 'stripe' }])
    const res = await DELETE(new NextRequest('http://localhost'), ctx)
    expect(res.status).toBe(400)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })
})
