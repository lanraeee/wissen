vi.mock('@/lib/db', () => ({ default: vi.fn() }))
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }))

import { normaliseTurns } from './support-agent'

// The Messages API requires alternating roles starting with the user. Real
// support threads break that constantly, and the result is a 400 -- which the
// agent handles by failing soft, so the visible symptom is "every chat hands
// off to a human" with nothing obviously wrong. These are the shapes that
// actually occurred.
describe('normaliseTurns', () => {
  it('merges consecutive visitor messages instead of sending two user turns', () => {
    const out = normaliseTurns([
      { author_type: 'visitor', body: 'hi' },
      { author_type: 'visitor', body: 'anyone there?' },
    ])
    expect(out).toEqual([{ role: 'user', content: 'hi\n\nanyone there?' }])
  })

  it('merges consecutive staff and ai messages into one assistant turn', () => {
    const out = normaliseTurns([
      { author_type: 'visitor', body: 'hello' },
      { author_type: 'ai', body: 'Hi there' },
      { author_type: 'staff', body: 'Adding to that' },
    ])
    expect(out.map(t => t.role)).toEqual(['user', 'assistant'])
    expect(out[1].content).toBe('Hi there\n\nAdding to that')
  })

  it('drops leading assistant turns so the thread opens with the user', () => {
    const out = normaliseTurns([
      { author_type: 'ai', body: 'Welcome!' },
      { author_type: 'visitor', body: 'my question' },
    ])
    expect(out).toEqual([{ role: 'user', content: 'my question' }])
  })

  it('drops empty and whitespace-only bodies, which are themselves a 400', () => {
    const out = normaliseTurns([
      { author_type: 'visitor', body: '   ' },
      { author_type: 'visitor', body: 'real question' },
    ])
    expect(out).toEqual([{ role: 'user', content: 'real question' }])
  })

  it('always produces strictly alternating roles', () => {
    const out = normaliseTurns([
      { author_type: 'visitor', body: 'a' },
      { author_type: 'visitor', body: 'b' },
      { author_type: 'ai', body: 'c' },
      { author_type: 'staff', body: 'd' },
      { author_type: 'visitor', body: 'e' },
    ])
    expect(out.map(t => t.role)).toEqual(['user', 'assistant', 'user'])
  })

  it('returns nothing for a thread with no usable visitor content', () => {
    expect(normaliseTurns([{ author_type: 'ai', body: 'hello' }])).toEqual([])
    expect(normaliseTurns([])).toEqual([])
  })
})
