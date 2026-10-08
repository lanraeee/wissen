// Turns a meeting's free-text "Minutes" field into typed blocks for the
// preview/print document in components/admin/cio/MinutesPreview.tsx.
// Deliberately a small, forgiving parser (same spirit as
// lib/constitution-render.ts): only "N. Heading" and "N.N text" lines get
// special treatment, everything else renders as a plain paragraph, so
// minutes that do not follow that numbering still preview instead of
// breaking.

import { parseInline, type Run } from './constitution-render'

export type MinutesBlock =
  | { kind: 'heading'; num: string; title: string }
  | { kind: 'para'; num: string; runs: Run[] }
  | { kind: 'plain'; runs: Run[] }

const HEADING = /^(\d{1,2})\.\s+(.+)$/
const NUMBERED = /^(\d{1,2}\.\d{1,2})\s+(.+)$/

export function parseMinutes(source: string): MinutesBlock[] {
  const blocks: MinutesBlock[] = []
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const heading = line.match(HEADING)
    const numbered = line.match(NUMBERED)
    if (heading) { blocks.push({ kind: 'heading', num: heading[1], title: heading[2] }); continue }
    if (numbered) { blocks.push({ kind: 'para', num: numbered[1], runs: parseInline(numbered[2]) }); continue }
    blocks.push({ kind: 'plain', runs: parseInline(line) })
  }
  return blocks
}

// Words/phrases worth a status pill in the preview -- a quick visual scan
// for what was actually decided versus what is still open.
export const RESOLVED_RE = /\bRESOLVED\b/
export const OPEN_RE = /\b(DEFERRED|NOT resolved|TO BE CONFIRMED|Not considered)\b/i
