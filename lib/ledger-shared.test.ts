import { totalsByCurrency, monthlyEquivalent, monthlyTotals, formatMoney } from './ledger-shared'

describe('totalsByCurrency', () => {
  it('sums in and out per currency and leaves out transfers and excluded rows', () => {
    const t = totalsByCurrency([
      { occurred_on: '2026-10-01', source: 'stripe', direction: 'in', amount: '100.10', currency: 'GBP', description: 'd' },
      { occurred_on: '2026-10-01', source: 'tide', direction: 'out', amount: 40, currency: 'GBP', description: 'd' },
      { occurred_on: '2026-10-01', source: 'stripe', direction: 'out', amount: 60, currency: 'GBP', description: 'payout', is_transfer: true },
      { occurred_on: '2026-10-01', source: 'tide', direction: 'out', amount: 999, currency: 'GBP', description: 'x', excluded: true },
      { occurred_on: '2026-10-01', source: 'ng_bank', direction: 'in', amount: 5000, currency: 'NGN', description: 'd' },
    ])
    expect(t).toEqual([
      { currency: 'GBP', moneyIn: 100.1, moneyOut: 40, net: 60.1 },
      { currency: 'NGN', moneyIn: 5000, moneyOut: 0, net: 5000 },
    ])
  })
})

describe('fixed costs', () => {
  it('spreads quarterly and annual bills across months', () => {
    expect(monthlyEquivalent(120, 'annual')).toBe(10)
    expect(monthlyEquivalent('30', 'quarterly')).toBe(10)
    expect(monthlyEquivalent(12.5, 'monthly')).toBe(12.5)
  })

  it('totals active lines per currency only', () => {
    expect(monthlyTotals([
      { amount: 120, currency: 'GBP', billing_cycle: 'annual' },
      { amount: 5, currency: 'GBP', billing_cycle: 'monthly' },
      { amount: 50, currency: 'GBP', billing_cycle: 'monthly', is_active: false },
      { amount: 3000, currency: 'NGN', billing_cycle: 'monthly' },
    ])).toEqual([{ currency: 'GBP', monthly: 15 }, { currency: 'NGN', monthly: 3000 }])
  })
})

it('formatMoney survives an unknown currency code', () => {
  expect(formatMoney(5, 'GBP')).toBe('£5.00')
  expect(formatMoney(5, 'NOPE')).toBe('NOPE 5.00')
})
