import Link from 'next/link'
import { parseBody, type PolicySection, type Run } from '@/lib/policy-doc'

const link = { color: '#1a3c2e' }

export function Runs({ runs }: { runs: Run[] }) {
  return <>{runs.map((r, i) => {
    if (r.ref !== undefined) {
      return <sup key={i}><a href={`#ref-${r.ref}`} style={{ color: '#1a3c2e', textDecoration: 'none', fontWeight: 600 }}>[{r.ref}]</a></sup>
    }
    let node: React.ReactNode = r.t
    if (r.code) node = <code>{node}</code>
    if (r.b) node = <strong>{node}</strong>
    if (r.i) node = <em>{node}</em>
    if (r.href) {
      node = r.href.startsWith('/') || r.href.startsWith('#')
        ? <Link href={r.href} style={link}>{node}</Link>
        : <a href={r.href} style={link} {...(r.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{node}</a>
    }
    return <span key={i} style={{ display: 'contents' }}>{node}</span>
  })}</>
}

/** Renders a body string (paragraphs, lists, links, references) -- used for single editable text fields too. */
export function Markup({ text, slots }: { text: string; slots?: Record<string, React.ReactNode> }) {
  return <>{parseBody(text).map((b, j) =>
    b.kind === 'p' ? <p key={j}><Runs runs={b.runs} /></p>
    : b.kind === 'ul' ? <ul key={j} style={{ paddingLeft: 20 }}>{b.items.map((it, k) => <li key={k}><Runs runs={it} /></li>)}</ul>
    : b.kind === 'ol' ? <ol key={j} style={{ paddingLeft: 20 }}>{b.items.map((it, k) => <li key={k}><Runs runs={it} /></li>)}</ol>
    : b.kind === 'h3' ? <h3 key={j} style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 20, color: '#1a2e24' }}>{b.text}</h3>
    : <div key={j}>{slots?.[b.name] ?? null}</div>
  )}</>
}

/**
 * Contents box plus numbered sections, rendered from editable section data.
 * `variant="wiki"` uses the encyclopedia styling (inline contents box, tighter
 * headings); `tocExtra` appends unnumbered-heading entries such as References.
 */
export default function PolicyDocument({ sections, variant = 'policy', slots, tocExtra = [] }: {
  sections: PolicySection[]
  variant?: 'policy' | 'wiki'
  slots?: Record<string, React.ReactNode>
  tocExtra?: { id: string; label: string }[]
}) {
  const wiki = variant === 'wiki'
  const toc = [...sections.map(s => ({ id: s.id, label: s.title })), ...tocExtra]
  return (
    <>
      <div style={{ background: '#f0ece4', border: '1px solid #ddd9d0', borderRadius: 8, padding: '16px 20px', margin: '24px 0', ...(wiki ? { display: 'inline-block', minWidth: 200 } : {}) }}>
        <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 10 }}>Contents</div>
        <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: '.88rem', ...(wiki ? {} : { columns: 2, columnGap: 24 }) }}>
          {toc.map((s, i) => (
            <li key={s.id} style={{ marginBottom: 4, ...(wiki ? {} : { breakInside: 'avoid' as const }) }}>
              <a href={`#${s.id}`} style={{ color: '#1a3c2e', textDecoration: 'none' }}>{i + 1}. {s.label}</a>
            </li>
          ))}
        </ol>
      </div>

      {sections.map((s, i) => (
        <section key={s.id}>
          <h2 id={s.id} style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: wiki ? 32 : 36, color: '#0f2d1d', scrollMarginTop: 90 }}>
            {i + 1}. {s.title}
          </h2>
          <Markup text={s.body} slots={slots} />
        </section>
      ))}
    </>
  )
}
