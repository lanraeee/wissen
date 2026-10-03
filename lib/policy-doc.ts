// Client-safe model for the long, sectioned policy pages (Safeguarding,
// Privacy, Terms). Same safety stance as lib/page-copy-shared.ts: sections are
// plain text with a tiny fixed markup that is parsed into typed nodes and
// rendered as React elements -- never raw HTML -- so an editor can reword or
// restructure a policy but cannot inject markup or scripts.

export interface PolicySection { id: string; title: string; body: string }

export type PolicyPage = { slug: string; label: string }
export const POLICY_PAGES: PolicyPage[] = [
  { slug: 'safeguarding', label: 'Safeguarding Policy' },
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'terms', label: 'Terms & Conditions' },
]

export const policyContentKey = (slug: string) => `policy_doc_${slug}`

export const MAX_SECTIONS = 60
export const MAX_TITLE = 120
export const MAX_BODY = 20_000

export type Run = { t: string; b?: boolean; i?: boolean; code?: boolean; href?: string }
export type Block =
  | { kind: 'p'; runs: Run[] }
  | { kind: 'ul' | 'ol'; items: Run[][] }

/** Only same-site paths, anchors, mailto and http(s) links are rendered as links. */
export function safeHref(h: string): string | null {
  const href = h.trim()
  if (/^(\/(?!\/)|#|mailto:|https?:\/\/)/i.test(href)) return href
  return null
}

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*/g

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
    else runs.push({ t: m[5], i: true })
    last = m.index! + m[0].length
  }
  if (last < text.length) runs.push({ t: text.slice(last) })
  return runs.length ? runs : [{ t: text }]
}

export function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of body.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) continue
    if (lines.every(l => /^[-*]\s+/.test(l))) {
      blocks.push({ kind: 'ul', items: lines.map(l => parseInline(l.replace(/^[-*]\s+/, ''))) })
    } else if (lines.every(l => /^\d+[.)]\s+/.test(l))) {
      blocks.push({ kind: 'ol', items: lines.map(l => parseInline(l.replace(/^\d+[.)]\s+/, ''))) })
    } else {
      blocks.push({ kind: 'p', runs: parseInline(lines.join(' ')) })
    }
  }
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
    const { id, title, body } = s as Record<string, unknown>
    if (typeof title !== 'string' || typeof body !== 'string' || !title.trim()) return null
    out.push({ id: typeof id === 'string' ? id : '', title: title.slice(0, MAX_TITLE), body: body.slice(0, MAX_BODY) })
  }
  return withIds(out)
}
