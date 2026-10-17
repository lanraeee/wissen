import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CHARITABLE_OBJECTS } from './charitable-objects'

// The site must state the objects exactly as the constitution does. This reads
// clause 2.1 from the draft and checks each object against it, so an edit to
// either side that is not mirrored in the other fails here.
const CONSTITUTION = fileURLToPath(
  new URL('../docs/foundation-cio/03_Constitution_DRAFT.md', import.meta.url),
)

function clauseTwoOne(): Array<{ letter: string; title: string; rest: string }> {
  const text = readFileSync(CONSTITUTION, 'utf8')
  // Only the block between clause 2.1 and clause 2.2; other sections also use (a)–(d) lists.
  const start = text.indexOf('2.1 The objects of the CIO are:')
  const end = text.indexOf('2.2 The CIO is established')
  const block = start >= 0 && end > start ? text.slice(start, end) : ''
  const clauses: Array<{ letter: string; title: string; rest: string }> = []
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*\(([a-d])\) \*\*(.+?)\*\*(.*)$/)
    if (m) clauses.push({ letter: m[1], title: m[2], rest: m[3] })
  }
  return clauses
}

describe('CHARITABLE_OBJECTS', () => {
  const clauses = clauseTwoOne()

  it('finds the four objects in clause 2.1 of the constitution', () => {
    expect(clauses.map(c => c.letter)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('has exactly the four objects, in clause order', () => {
    expect(CHARITABLE_OBJECTS).toHaveLength(4)
    CHARITABLE_OBJECTS.forEach((o, i) => {
      expect(o.title).toBe(clauses[i].title)
      expect(o.rest).toBe(clauses[i].rest)
    })
  })
})
