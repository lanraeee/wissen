// Client-safe model for the long, sectioned policy pages (Safeguarding,
// Privacy, Terms). Same safety stance as lib/page-copy-shared.ts: sections are
// plain text with a tiny fixed markup that is parsed into typed nodes and
// rendered as React elements -- never raw HTML -- so an editor can reword or
// restructure a policy but cannot inject markup or scripts.

export interface PolicySection {
  id: string
  title: string
  body: string
  /** Saved marker: "this section is still the built-in text" -- it follows the brand name and any code update to the default. */
  isDefault?: boolean
}

export type PolicyPage = { slug: string; label: string }
export const POLICY_PAGES: PolicyPage[] = [
  { slug: 'wiki', label: 'Wiki / Overview' },
  { slug: 'safeguarding', label: 'Safeguarding Policy' },
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'terms', label: 'Terms & Conditions' },
]

export const policyContentKey = (slug: string) => `policy_doc_${slug}`

export const MAX_SECTIONS = 60
export const MAX_TITLE = 120
export const MAX_BODY = 20_000

export type Run = { t: string; b?: boolean; i?: boolean; code?: boolean; href?: string; ref?: number }
export type Block =
  | { kind: 'p'; runs: Run[] }
  | { kind: 'ul'; items: Run[][] }
  | { kind: 'ol'; items: Run[][] }
  | { kind: 'h3'; text: string }
  | { kind: 'slot'; name: string }

/** Only same-site paths, anchors, mailto and http(s) links are rendered as links. */
export function safeHref(h: string): string | null {
  const href = h.trim()
  if (/^(\/(?!\/)|#|mailto:|https?:\/\/)/i.test(href)) return href
  return null
}

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*|\{ref:(\d{1,3})\}/g

export function parseInline(text: string): Run[] {
  const runs: Run[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) runs.push({ t: text.slice(last, m.index) })
    if (m[1] !== undefined) {
      const href = safeHref(m[2])
      runs.push(href ? { t: m[1], href } : { t: m[1] })
    } else if (m[3] !== undefined) runs.push({ t: m[3], b: true })
    else if (m[4] !== undefined) runs.push({ t: m[4], code: true })
    else if (m[6] !== undefined) runs.push({ t: m[6], ref: Number(m[6]) })
    else runs.push({ t: m[5], i: true })
    last = m.index! + m[0].length
  }
  if (last < text.length) runs.push({ t: text.slice(last) })
  return runs.length ? runs : [{ t: text }]
}

export function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', runs: parseInline(para.join(' ')) })
    if (list) blocks.push(list.kind === 'ul' ? { kind: 'ul', items: list.items.map(parseInline) } : { kind: 'ol', items: list.items.map(parseInline) })
    para = []; list = null
  }
  for (const raw of body.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    const h3 = line.match(/^###\s+(.+)$/)
    if (h3) { flush(); blocks.push({ kind: 'h3', text: h3[1] }); continue }
    const slot = line.match(/^\{\{([a-z-]{1,30})\}\}$/)
    if (slot) { flush(); blocks.push({ kind: 'slot', name: slot[1] }); continue }
    const ul = line.match(/^[-*]\s+(.*)$/)
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol'
      if (para.length || (list && list.kind !== kind)) flush()
      if (!list) list = { kind, items: [] }
      list.items.push((ul ?? ol)![1])
      continue
    }
    if (list) flush()
    para.push(line)
  }
  flush()
  return blocks
}

export function slugify(title: string): string {
  return title.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'section'
}

/** Gives every section a unique, anchor-safe id (new sections have none). */
export function withIds(sections: PolicySection[]): PolicySection[] {
  const seen = new Set<string>()
  return sections.map(s => {
    const base = /^[a-z0-9-]+$/.test(s.id) ? s.id : slugify(s.title)
    let id = base, n = 2
    while (seen.has(id)) id = `${base}-${n++}`
    seen.add(id)
    return { ...s, id }
  })
}

/** Validates an untrusted saved value; returns null when it is not a usable section list. */
export function coerceSections(v: unknown): PolicySection[] | null {
  const list = (v as { sections?: unknown } | null)?.sections
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_SECTIONS) return null
  const out: PolicySection[] = []
  for (const s of list) {
    if (!s || typeof s !== 'object') return null
    const { id, title, body, isDefault } = s as Record<string, unknown>
    if (isDefault === true && typeof id === 'string') { out.push({ id, title: '', body: '', isDefault: true }); continue }
    if (typeof title !== 'string' || typeof body !== 'string' || !title.trim()) return null
    out.push({ id: typeof id === 'string' ? id : '', title: title.slice(0, MAX_TITLE), body: body.slice(0, MAX_BODY) })
  }
  return withIdsKeepDefaults(out)
}

/** Parses "Label | value" lines (blank lines and lines without a separator are skipped). */
export function parsePairs(text: string): [string, string][] {
  const out: [string, string][] = []
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const i = raw.indexOf('|')
    if (i < 0) continue
    const a = raw.slice(0, i).trim(), b = raw.slice(i + 1).trim()
    if (a && b) out.push([a, b])
  }
  return out
}

function withIdsKeepDefaults(list: PolicySection[]): PolicySection[] {
  // Default-markers keep their id (it is the lookup key); everything else gets a unique anchor id.
  const taken = new Set(list.filter(x => x.isDefault).map(x => x.id))
  return list.map(x => {
    if (x.isDefault) return x
    const base = /^[a-z0-9-]+$/.test(x.id) ? x.id : slugify(x.title)
    let id = base, n = 2
    while (taken.has(id)) id = `${base}-${n++}`
    taken.add(id)
    return { ...x, id }
  })
}

/**
 * Turns saved sections into displayable ones. Sections still marked as the
 * built-in text are looked up by id in `defaults` and passed through `apply`
 * (the brand swap); anything an editor typed is shown exactly as typed.
 */
export function resolveSections(saved: PolicySection[] | null, defaults: PolicySection[], apply: (text: string) => string = t => t): PolicySection[] {
  const byId = new Map(defaults.map(d => [d.id, d]))
  const base = saved ?? defaults.map(d => ({ ...d, isDefault: true }))
  const out: PolicySection[] = []
  for (const s of base) {
    if (s.isDefault) {
      const d = byId.get(s.id)
      if (d) out.push({ id: d.id, title: apply(d.title), body: apply(d.body) })
    } else out.push({ id: s.id, title: s.title, body: s.body })
  }
  return withIds(out)
}
