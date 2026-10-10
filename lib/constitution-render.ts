// Turns the constitution's markdown-ish text into typed blocks for the booklet preview.
// Deliberately a small, forgiving subset parser: anything it does not recognise is kept as a plain paragraph,
// so a differently formatted draft still previews rather than failing.

export interface Run { t: string; b?: boolean; i?: boolean }

export type Block =
  | { kind: 'clause'; num: string; title: string }
  | { kind: 'sub'; num: string; title: string }
  | { kind: 'para'; num?: string; runs: Run[] }
  | { kind: 'item'; label: string; level: 1 | 2; runs: Run[] }
  | { kind: 'bullet'; runs: Run[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'sig'; label: string; who?: number }
  | { kind: 'end' }

export interface ParsedConstitution {
  title: string
  orgName: string
  subtitle: string
  blocks: Block[]
}

export function parseInline(text: string): Run[] {
  const runs: Run[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) runs.push({ t: text.slice(last, m.index) })
    runs.push(m[1] !== undefined ? { t: m[1], b: true } : { t: m[2], i: true })
    last = m.index! + m[0].length
  }
  if (last < text.length) runs.push({ t: text.slice(last) })
  return runs.length ? runs : [{ t: text }]
}

const splitRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

export function parseConstitution(source: string): ParsedConstitution {
  const out: ParsedConstitution = { title: 'Constitution', orgName: '', subtitle: '', blocks: [] }
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  let started = false // becomes true at the first numbered clause
  let ended = false

  for (let i = 0; i < lines.length && !ended; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line || /^-{3,}$/.test(line)) continue

    if (/^\*{0,2}END OF CONSTITUTION\*{0,2}$/i.test(line)) { out.blocks.push({ kind: 'end' }); ended = true; continue }

    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const text = h[2].replace(/\*+/g, '').trim()
      const clause = text.match(/^(\d+)\.\s+(.*)$/)
      const sub = text.match(/^(\d+\.\d+)\s+(.*)$/)
      if (level <= 2 && clause) { started = true; out.blocks.push({ kind: 'clause', num: clause[1], title: clause[2] }); continue }
      if (sub && started) { out.blocks.push({ kind: 'sub', num: sub[1], title: sub[2] }); continue }
      if (!started) {
        if (level === 1) out.title = text
        else if (level === 2) out.orgName = text
        else out.subtitle = text
        continue
      }
      out.blocks.push({ kind: 'sub', num: '', title: text })
      continue
    }

    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!/^\|[\s:|-]+\|?$/.test(lines[i].trim())) rows.push(splitRow(lines[i]))
        i++
      }
      i--
      if (rows.length) out.blocks.push({ kind: 'table', head: rows[0], rows: rows.slice(1) })
      continue
    }

    const sig = line.match(/^Signature:\s*_+\s*(Date:.*)?$/i)
    if (sig) { out.blocks.push({ kind: 'sig', label: 'Signature' }); continue }

    const item = raw.match(/^(\s*)\(([a-z]{1,4}|[ivxlc]+)\)\s+(.*)$/)
    if (item) { out.blocks.push({ kind: 'item', label: `(${item[2]})`, level: item[1].length >= 6 ? 2 : 1, runs: parseInline(item[3]) }); continue }

    const bullet = line.match(/^[-*•]\s+(.*)$/)
    if (bullet) { out.blocks.push({ kind: 'bullet', runs: parseInline(bullet[1]) }); continue }

    const num = line.match(/^(\d+\.\d+(?:\.\d+)?)\s+(.*)$/)
    if (num) { out.blocks.push({ kind: 'para', num: num[1], runs: parseInline(num[2]) }); continue }

    out.blocks.push({ kind: 'para', runs: parseInline(line) })
  }
  return out
}

/** Heading blocks must stay on the same page as whatever follows them. */
export const keepWithNext = (b: Block) => b.kind === 'clause' || b.kind === 'sub'

export interface Piece { i: number; from?: number; to?: number }

/** Text blocks that may be split across pages at a line boundary. */
export const splittable = (b: Block) => b.kind === 'para' || b.kind === 'item' || b.kind === 'bullet'

/**
 * Greedy page fill with line-level splitting. `heights[i]` is block i's rendered height (text blocks are
 * `lines * lineHeight + pad`). A heading is always placed with the first lines of whatever follows it, and a
 * split leaves at least `minLines` lines on both sides (no widows or orphans). Non-text blocks never split.
 */
export function paginate(blocks: Block[], heights: number[], pageHeight: number, lineHeight = 21, pad = 9, minLines = 2): Piece[][] {
  const pages: Piece[][] = [[]]
  let used = 0
  const newPage = () => { if (pages[pages.length - 1].length) { pages.push([]); used = 0 } }
  const place = (p: Piece, h: number) => { pages[pages.length - 1].push(p); used += h }
  const linesOf = (i: number) => Math.max(1, Math.round(((heights[i] ?? 0) - pad) / lineHeight))

  for (let i = 0; i < blocks.length; ) {
    const lead: number[] = [i]
    while (keepWithNext(blocks[lead[lead.length - 1]]) && lead[lead.length - 1] + 1 < blocks.length) lead.push(lead[lead.length - 1] + 1)
    const last = lead[lead.length - 1]
    const headN = keepWithNext(blocks[last]) ? lead.length : lead.length - 1 // headings before the block that carries text
    const head = lead.slice(0, headN)
    const headH = head.reduce((sum, g) => sum + (heights[g] ?? 0), 0)

    if (headN === lead.length || !splittable(blocks[last])) {
      const h = lead.reduce((sum, g) => sum + (heights[g] ?? 0), 0)
      if (used > 0 && used + h > pageHeight) newPage()
      lead.forEach(g => place({ i: g }, heights[g] ?? 0))
      i = last + 1
      continue
    }

    const total = linesOf(last)
    const wholeH = headH + heights[last]
    if (used + wholeH <= pageHeight) {
      head.forEach(g => place({ i: g }, heights[g] ?? 0))
      place({ i: last }, heights[last])
      i = last + 1
      continue
    }

    const cap = Math.floor(pageHeight / lineHeight)
    const firstChunk = (avail: number) => {
      let f = Math.min(avail, total)
      if (total - f > 0 && total - f < minLines) f = total - minLines
      return f
    }
    let fit = firstChunk(Math.floor((pageHeight - used - headH) / lineHeight))
    if (fit < minLines && used > 0) {
      newPage()
      fit = firstChunk(Math.floor((pageHeight - headH) / lineHeight))
    }
    fit = Math.max(1, fit)
    head.forEach(g => place({ i: g }, heights[g] ?? 0))
    let from = 0
    let take = Math.min(fit, total)
    while (true) {
      const end = from + take >= total
      place(end && from === 0 ? { i: last } : { i: last, from, to: from + take }, take * lineHeight + (end ? pad : 0))
      from += take
      if (end) break
      newPage()
      const rem = total - from
      take = rem <= cap ? rem : rem - cap > 0 && rem - cap < minLines ? rem - minLines : cap
    }
    i = last + 1
  }
  return pages.filter(p => p.length > 0)
}

/** Replaces the constitution's signature line with one signature block per signatory (index kept in `who`). With no signatories the original single line is left alone. */
export function expandSignatories(blocks: Block[], count: number): Block[] {
  if (count <= 0) return blocks
  const out: Block[] = []
  let done = false
  for (const b of blocks) {
    if (b.kind !== 'sig') { out.push(b); continue }
    if (done) continue
    done = true
    for (let who = 0; who < count; who++) out.push({ ...b, who })
  }
  return out
}
