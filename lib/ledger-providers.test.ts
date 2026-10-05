vi.mock('@/lib/stripe', () => ({ getStripe: vi.fn() }))

import { mapStripeTxn, mapGoCardlessTxn, mapMonoTxn, parseAccountList } from './ledger-providers'

describe('mapStripeTxn', () => {
  it('maps a charge to a donation without exposing the Stripe description publicly', () => {
    const t = mapStripeTxn({ id: 'txn_1', amount: 2500, fee: 58, currency: 'gbp', created: 1790000000, type: 'charge', description: 'Donation from Ada Lovelace' })
    expect(t).toMatchObject({
      source: 'stripe', externalId: 'txn_1', direction: 'in', amount: 25, fee: 0.58, currency: 'GBP',
      description: 'Card donation via Stripe', category: 'donation', counterparty: 'Donation from Ada Lovelace', isTransfer: false,
    })
    expect(t.description).not.toContain('Ada')
  })

  it('treats payouts as transfers going out', () => {
    const t = mapStripeTxn({ id: 'txn_2', amount: -10000, fee: 0, currency: 'gbp', created: 1790000000, type: 'payout', description: null })
    expect(t).toMatchObject({ direction: 'out', amount: 100, isTransfer: true, fee: null })
  })
})

describe('parseAccountList', () => {
  it('reads source:label:id entries and drops malformed or unknown ones', () => {
    expect(parseAccountList('tide:Tide current:abc; uk_bank:Barclays:def;stripe:x:y;broken', ['tide', 'uk_bank'])).toEqual([
      { source: 'tide', label: 'Tide current', accountId: 'abc' },
      { source: 'uk_bank', label: 'Barclays', accountId: 'def' },
    ])
  })

  it('accepts label:id with a fallback source', () => {
    expect(parseAccountList('GTBank NGN:acc1', ['ng_bank'], 'ng_bank')).toEqual([{ source: 'ng_bank', label: 'GTBank NGN', accountId: 'acc1' }])
  })

  it('returns nothing when unset', () => {
    expect(parseAccountList(undefined, ['tide'])).toEqual([])
  })
})

describe('bank mappers', () => {
  const acct = { source: 'tide' as const, label: 'Tide current', accountId: 'A1' }

  it('maps a GoCardless debit, keeping the payee private', () => {
    const t = mapGoCardlessTxn(acct, {
      transactionId: 'T9', bookingDate: '2026-09-30',
      transactionAmount: { amount: '-45.00', currency: 'GBP' },
      creditorName: 'Google Workspace', remittanceInformationUnstructured: 'INV 123',
    })
    expect(t).toMatchObject({ externalId: 'A1:T9', direction: 'out', amount: 45, description: 'Bank payment', counterparty: 'Google Workspace · INV 123' })
  })

  it('derives a stable id when the bank gives none', () => {
    const raw = { bookingDate: '2026-09-30', transactionAmount: { amount: '10', currency: 'GBP' }, debtorName: 'J Bloggs' }
    expect(mapGoCardlessTxn(acct, raw)!.externalId).toBe(mapGoCardlessTxn(acct, raw)!.externalId)
  })

  it('skips a GoCardless row with no usable date', () => {
    expect(mapGoCardlessTxn(acct, { transactionAmount: { amount: '1', currency: 'GBP' } })).toBeNull()
  })

  it('maps a Mono credit from kobo', () => {
    const t = mapMonoTxn({ source: 'ng_bank', label: 'GTBank', accountId: 'M1' }, { id: 'x1', narration: 'TRF FROM ADA', amount: 1500000, type: 'credit', date: '2026-09-29T10:00:00.000Z' })
    expect(t).toMatchObject({ source: 'ng_bank', externalId: 'M1:x1', direction: 'in', amount: 15000, currency: 'NGN', occurredOn: '2026-09-29', description: 'Bank receipt' })
  })
})
