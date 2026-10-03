import Link from 'next/link'
import { parseBody, type PolicySection, type Run } from '@/lib/policy-doc'

const link = { color: '#1a3c2e' }

function Runs({ runs }: { runs: Run[] }) {
  return <>{runs.map((r, i) => {
    let node: React.ReactNode = r.t
    if (r.code) node = <code>{node}</code>
    if (r.b) node = <strong>{node}</strong>
    if (r.i) node = <em>{node}</em>
    if (r.href) {
      node = r.href.startsWith('/') || r.href.startsWith('#')
        ? <Link href={r.href} style={link}>{node}</Link>
        : <a href={r.href} style={link} {...(r.href.startsWith('http') ? { rel: 'noopener noreferrer' } : {})}>{node}</a>
    }
    return <span key={i} style={{ display: 'contents' }}>{node}</span>
  })}</>
}

/** Contents box plus numbered sections, rendered from editable section data. */
export default function PolicyDocument({ sections }: { sections: PolicySection[] }) {
  return (
    <>
      <div style={{ background: '#f0ece4', border: '1px solid #ddd9d0', borderRadius: 8, padding: '16px 20px', margin: '24px 0' }}>
        <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 10 }}>Contents</div>
        <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: '.88rem', columns: 2, columnGap: 24 }}>
          {sections.map((s, i) => (
            <li key={s.id} style={{ marginBottom: 4, breakInside: 'avoid' }}>
              <a href={`#${s.id}`} style={{ color: '#1a3c2e', textDecoration: 'none' }}>{i + 1}. {s.title}</a>
            </li>
          ))}
        </ol>
      </div>

      {sections.map((s, i) => (
        <section key={s.id}>
          <h2 id={s.id} style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 36, color: '#0f2d1d', scrollMarginTop: 90 }}>
            {i + 1}. {s.title}
          </h2>
          {parseBody(s.body).map((b, j) =>
            b.kind === 'p' ? <p key={j}><Runs runs={b.runs} /></p>
            : b.kind === 'ul' ? <ul key={j} style={{ paddingLeft: 20 }}>{b.items.map((it, k) => <li key={k}><Runs runs={it} /></li>)}</ul>
            : <ol key={j} style={{ paddingLeft: 20 }}>{b.items.map((it, k) => <li key={k}><Runs runs={it} /></li>)}</ol>
          )}
        </section>
      ))}
    </>
  )
}
