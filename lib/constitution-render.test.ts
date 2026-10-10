import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { parseConstitution, parseInline, paginate, expandSignatories, type Block } from './constitution-render'

describe('parseInline', () => {
  it('handles bold, italic and plain text', () => {
    expect(parseInline('a **b** c *d*')).toEqual([{ t: 'a ' }, { t: 'b', b: true }, { t: ' c ' }, { t: 'd', i: true }])
    expect(parseInline('plain')).toEqual([{ t: 'plain' }])
  })
})

describe('parseConstitution', () => {
  const sample = [
    '# CONSTITUTION', '## WISSEN-HAUS EMPOWERMENT FOUNDATION', '### A Charitable Incorporated Organisation', '---',
    '## 1. NAME AND PRINCIPAL OFFICE', '1.1 The name is **Wissen-Haus**.', '',
    '## 4. TRUSTEES', '### 4.1 Number', '4.2 Text', '   (a) first;', '      (i) nested', '| A | B |', '|---|---|', '| 1 | 2 |', '',
    'Signature: _________________________ Date: _____________', '**END OF CONSTITUTION**', '## NEXT STEPS', 'ignored',
  ].join('\n')
  const p = parseConstitution(sample)

  it('reads the front matter', () => {
    expect([p.title, p.orgName, p.subtitle]).toEqual(['CONSTITUTION', 'WISSEN-HAUS EMPOWERMENT FOUNDATION', 'A Charitable Incorporated Organisation'])
  })
  it('recognises clauses, subsections, numbered paragraphs, items, tables and signatures', () => {
    expect(p.blocks.map(b => b.kind)).toEqual(['clause', 'para', 'clause', 'sub', 'para', 'item', 'item', 'table', 'sig', 'end'])
    expect(p.blocks[0]).toEqual({ kind: 'clause', num: '1', title: 'NAME AND PRINCIPAL OFFICE' })
    expect(p.blocks[6]).toMatchObject({ kind: 'item', level: 2, label: '(i)' })
    expect(p.blocks[7]).toEqual({ kind: 'table', head: ['A', 'B'], rows: [['1', '2']] })
  })
  it('stops at END OF CONSTITUTION so trailing notes never print in the booklet', () => {
    expect(JSON.stringify(p.blocks)).not.toContain('NEXT STEPS')
  })
  it('degrades to plain paragraphs for unstructured text', () => {
    expect(parseConstitution('Just some words.\n\nAnd more.').blocks.map(b => b.kind)).toEqual(['para', 'para'])
    expect(parseConstitution('').blocks).toEqual([])
  })
  it('parses the real draft constitution', () => {
    const real = parseConstitution(readFileSync('docs/foundation-cio/03_Constitution_DRAFT.md', 'utf8'))
    expect(real.blocks.filter(b => b.kind === 'clause').length).toBeGreaterThanOrEqual(20)
    expect(real.blocks.some(b => b.kind === 'table')).toBe(true)
    expect(real.blocks.filter(b => b.kind === 'sig').length).toBe(3)
    expect(real.blocks.at(-1)).toEqual({ kind: 'end' })
    expect(real.orgName).toMatch(/WISSEN.HAUS FOUNDATION/)
  })
})

describe('paginate', () => {
  const para: Block = { kind: 'para', runs: [] }
  const clause: Block = { kind: 'clause', num: '1', title: 'X' }
  const table: Block = { kind: 'table', head: [], rows: [] }
  const LH = 21, PAD = 9
  const h = (lines: number) => lines * LH + PAD
  const flat = (pages: ReturnType<typeof paginate>) => pages.map(p => p.map(x => (x.from === undefined ? `${x.i}` : `${x.i}[${x.from}-${x.to}]`)))

  it('fills pages with whole blocks when they fit', () => {
    expect(flat(paginate([para, para, para], [h(2), h(2), h(2)], 140, LH, PAD))).toEqual([['0', '1'], ['2']])
  })
  it('splits a long paragraph across pages instead of leaving a gap', () => {
    const pages = paginate([para, para], [h(3), h(10)], 12 * LH, LH, PAD)
    expect(flat(pages)).toEqual([['0', '1[0-8]'], ['1[8-10]']].map(p => p))
  })
  it('never leaves fewer than two lines on either side of a split (widows and orphans)', () => {
    for (let total = 4; total < 40; total++) for (let used = 0; used < 12; used++) {
      const blocks: Block[] = [para, para]
      const hs = [used ? h(used) : 0, h(total)]
      const pages = paginate(used ? blocks : [blocks[1]], used ? hs : [hs[1]], 12 * LH, LH, PAD)
      for (const pg of pages) for (const piece of pg) {
        if (piece.from === undefined) continue
        expect(piece.to! - piece.from).toBeGreaterThanOrEqual(2)
      }
      for (const pg of pages) expect(pg.reduce((s, x) => s + (x.from === undefined ? hs[used ? x.i : 1] : (x.to! - x.from) * LH), 0)).toBeLessThanOrEqual(12 * LH + PAD)
    }
  })
  it('accounts for every line of a split block exactly once', () => {
    const pages = paginate([para], [h(31)], 10 * LH, LH, PAD)
    const lines = pages.flat().reduce((s, x) => s + ((x.to ?? 31) - (x.from ?? 0)), 0)
    expect(lines).toBe(31)
  })
  it('keeps a heading with the first lines of the text after it', () => {
    const pages = paginate([para, clause, para], [h(9), 60, h(6)], 12 * LH, LH, PAD)
    const second = pages[1]?.map(x => x.i) ?? []
    expect(pages[0].map(x => x.i)).not.toEqual([0, 1])
    expect(second[0]).toBe(1)
  })
  it('does not split tables and places an oversized one on its own page', () => {
    expect(flat(paginate([para, table], [h(2), 900], 200, LH, PAD))).toEqual([['0'], ['1']])
  })
  it('handles an empty document', () => {
    expect(paginate([], [], 100)).toEqual([])
  })
})

describe('expandSignatories', () => {
  const blocks: Block[] = [{ kind: 'para', runs: [] }, { kind: 'sig', label: 'Signature' }, { kind: 'sig', label: 'Signature' }, { kind: 'end' }]
  it('makes one signature block per signatory, in order', () => {
    const out = expandSignatories(blocks, 3)
    expect(out.map(b => b.kind)).toEqual(['para', 'sig', 'sig', 'sig', 'end'])
    expect(out.filter(b => b.kind === 'sig').map(b => (b as { who?: number }).who)).toEqual([0, 1, 2])
  })
  it('leaves the document unchanged with no signatories', () => {
    expect(expandSignatories(blocks, 0)).toBe(blocks)
  })
})
