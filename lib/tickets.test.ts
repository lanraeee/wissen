vi.mock('@/lib/db', () => ({ default: vi.fn() }))

import { generateReference } from './tickets'

describe('generateReference', () => {
  it('uses the WH-XXXXX-XXXXX shape', () => {
    expect(generateReference()).toMatch(/^WH-[A-Z2-9]{5}-[A-Z2-9]{5}$/)
  })

  // The reference is the only credential a signed-out visitor holds for their
  // own thread. Shortening it, or making it sequential, would make every
  // ticket enumerable -- so guard the entropy, not just the format.
  it('does not collide across many draws', () => {
    const seen = new Set(Array.from({ length: 5000 }, () => generateReference()))
    expect(seen.size).toBe(5000)
  })

  it('omits characters that are misread when typed back in', () => {
    const drawn = Array.from({ length: 300 }, () => generateReference()).join('')
    // I/L/O/U are ambiguous against 1/0/V; 0 and 1 are excluded with them.
    expect(drawn).not.toMatch(/[ILOU01]/)
  })
})
