import { describe, it, expect } from 'vitest'
import { daysUntil, dateInput, fmtDate, humanise } from './cio-ui'

describe('cio-ui helpers', () => {
  const now = new Date('2026-10-03T15:00:00Z')
  it('counts whole days regardless of time of day', () => {
    expect(daysUntil('2026-10-03T00:00:00.000Z', now)).toBe(0)
    expect(daysUntil('2026-10-10', now)).toBe(7)
    expect(daysUntil('2026-10-01', now)).toBe(-2)
    expect(daysUntil(null, now)).toBeNull()
    expect(daysUntil('nonsense', now)).toBeNull()
  })
  it('formats dates from ISO timestamps without timezone drift', () => {
    expect(dateInput('2026-10-03T00:00:00.000Z')).toBe('2026-10-03')
    expect(fmtDate('2026-10-03T00:00:00.000Z')).toBe('3 Oct 2026')
    expect(fmtDate(null)).toBe('—')
  })
  it('humanises enum values', () => {
    expect(humanise('written_resolution')).toBe('Written resolution')
  })
})
