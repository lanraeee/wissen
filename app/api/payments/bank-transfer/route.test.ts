const getPledgeMock = vi.fn()
const updatePledgeMock = vi.fn()
vi.mock('@/lib/bank-transfer', () => ({
  generateReference: () => 'WH-BT-TEST',
  getBankDetails: async () => ({ enabled: true, accounts: [], instructions: '' }),
  accountFor: () => null,
  getPledge: (...a: unknown[]) => getPledgeMock(...a),
  updatePledge: (...a: unknown[]) => updatePledgeMock(...a),
  createPledge: async () => undefined,
}))

vi.mock('@/lib/email', () => ({
  sendBankTransferInstructions: async () => undefined,
  sendBankTransferNotification: async () => undefined,
}))

import { NextRequest } from 'next/server'
import { PUT } from './route'

const REF = 'WH-BT-TEST'

function put(body: unknown) {
  return new NextRequest('https://www.wissenhaus.org/api/payments/bank-transfer', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function pledge(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1', reference: REF, name: 'Ada', email: 'ada@example.com', amount: 50000, currency: 'NGN',
    status: 'awaiting_transfer', created_at: '2026-10-01T00:00:00Z', proof_uploaded_at: undefined,
    ...overrides,
  }
}

describe('PUT /api/payments/bank-transfer (I have sent the transfer)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    updatePledgeMock.mockResolvedValue({ status: 'declared_sent' })
  })

  it('refuses to mark the transfer sent until proof of payment is uploaded', async () => {
    getPledgeMock.mockResolvedValue(pledge())
    const res = await PUT(put({ reference: REF }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/proof of payment/i)
    expect(updatePledgeMock).not.toHaveBeenCalled()
  })

  it('marks the transfer sent once proof is on file', async () => {
    getPledgeMock.mockResolvedValue(pledge({ proof_uploaded_at: '2026-10-02T00:00:00Z' }))
    const res = await PUT(put({ reference: REF }))
    expect(res.status).toBe(200)
    expect(updatePledgeMock).toHaveBeenCalledWith(REF, expect.objectContaining({ status: 'declared_sent' }))
  })

  it('still reports an already-declared transfer without asking for proof again', async () => {
    getPledgeMock.mockResolvedValue(pledge({ status: 'declared_sent' }))
    const res = await PUT(put({ reference: REF }))
    expect(res.status).toBe(200)
    expect(updatePledgeMock).not.toHaveBeenCalled()
  })
})
