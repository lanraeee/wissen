'use client'

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { parseConstitution, paginate, type Block, type Piece, type Run } from '@/lib/constitution-render'
import { btn } from '../cio-ui'
import { BOOKLET_CSS, PRINT_CSS, FONTS_URL, PAGE_W, PAGE_H, BODY_H, LINE_H } from './booklet-css'

interface Props {
  source: string
  versionLabel: string
  status: 'draft' | 'adopted' | 'superseded'
  adoptedDate?: string | null
}

const SMALL = new Set(['and', 'of', 'the', 'to', 'for', 'in', 'on', 'by', 'a', 'an', 'or', 'with', 'from'])
const ACRONYMS = new Set(['cio', 'uk', 'cac', 'tin'])
const titleCase = (s: string) =>
  s.toLowerCase().split(' ').map((w, i) => {
    const m = w.match(/^([("']*)(.*?)([)"',:;.]*)$/)!
    const core = m[2]
    if (ACRONYMS.has(core)) return m[1] + core.toUpperCase() + m[3]
    return i > 0 && SMALL.has(core) ? w : m[1] + core.charAt(0).toUpperCase() + core.slice(1) + m[3]
  }).join(' ')

const longDate = (v?: string | null) => {
  if (!v) return ''
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

const Runs = ({ runs }: { runs: Run[] }) => (
  <>{runs.map((r, i) => (r.b ? <strong key={i}>{r.t}</strong> : r.i ? <em key={i}>{r.t}</em> : <Fragment key={i}>{r.t}</Fragment>))}</>
)

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case 'clause':
      return <div className="bk-clause"><div className="bk-kicker">Clause {b.num}</div><h2>{b.title}</h2><span className="bk-orn" /></div>
    case 'sub':
      return <div className="bk-sub">{b.num && <span className="bk-n">{b.num}</span>}<span>{b.title}</span></div>
    case 'para':
      return b.num
        ? <div className="bk-para"><span className="bk-n">{b.num}</span><span><Runs runs={b.runs} /></span></div>
        : <div className="bk-para bk-nonum"><Runs runs={b.runs} /></div>
    case 'item':
      return <div className={`bk-item l${b.level}`}><span className="bk-n">{b.label}</span><span><Runs runs={b.runs} /></span></div>
    case 'bullet':
      return <div className="bk-bullet"><span><Runs runs={b.runs} /></span></div>
    case 'table':
      return (
        <table className="bk-table">
          <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      )
    case 'sig':
      return <div className="bk-sigblock"><div className="bk-sigline" /><div className="bk-sigcap">Signature &nbsp;·&nbsp; Date</div></div>
    case 'end':
      return <div className="bk-end">End of Constitution</div>
  }
}

function Page({ n, side, run, folio, className = '', children }: { n: number; side: 'recto' | 'verso'; run?: [string, string]; folio?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`bk-page bk-${side} ${className}`} data-page={n}>
      {run && <div className="bk-run"><span>{run[0]}</span><span>{run[1]}</span></div>}
      {children}
      {folio && <div className="bk-folio">{folio}</div>}
    </div>
  )
}

const ROMAN = ['i', 'ii', 'iii', 'iv']
const TOC_PER_PAGE = 24

export default function ConstitutionPreview({ source, versionLabel, status, adoptedDate }: Props) {
  const parsed = useMemo(() => parseConstitution(source), [source])
  const measureRef = useRef<HTMLDivElement>(null)
  const allRef = useRef<HTMLDivElement>(null)
  // State, not a ref: the frame only exists once there is text, so the observer must attach whenever it appears.
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null)
  const [pages, setPages] = useState<Piece[][]>([])
  const [lines, setLines] = useState<number[]>([])
  const lineCount = (i: number) => lines[i] ?? 0
  const [scale, setScale] = useState(1)
  const [narrow, setNarrow] = useState(false)
  const [spread, setSpread] = useState(0)

  useEffect(() => {
    if (!document.getElementById('bk-fonts')) {
      const link = document.createElement('link')
      link.id = 'bk-fonts'
      link.rel = 'stylesheet'
      link.href = FONTS_URL
      document.head.appendChild(link)
    }
  }, [])

  // Measure every block at the real body width, then fill pages. Re-run once webfonts load: they change line breaks.
  useEffect(() => {
    let cancelled = false
    const run = () => {
      const el = measureRef.current
      if (!el || cancelled) return
      const heights = Array.from(el.children).map(c => (c as HTMLElement).offsetHeight)
      setLines(heights.map(h => Math.max(1, Math.round((h - 9) / LINE_H))))
      setPages(paginate(parsed.blocks, heights, BODY_H - 6, LINE_H))
    }
    run()
    document.fonts?.ready.then(run)
    return () => { cancelled = true }
  }, [parsed])

  useEffect(() => {
    const el = stageEl
    if (!el) return
    const fit = () => {
      const w = el.clientWidth
      const isNarrow = w < 800 // two pages would be unreadably small: show one at a time
      setNarrow(isNarrow)
      setScale(Math.max(0.2, Math.min(1, (w - 24) / (PAGE_W * (isNarrow ? 1 : 2)))))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [stageEl])

  const org = parsed.orgName || 'Wissen-Haus Empowerment Foundation'
  const title = titleCase(parsed.title || 'Constitution')
  const adopted = longDate(adoptedDate)
  const draftClass = status === 'draft' ? 'bk-draft' : ''

  const clausePage = useMemo(() => {
    const map: { num: string; title: string; page: number }[] = []
    pages.forEach((idxs, p) => idxs.forEach(({ i, from }) => { const b = parsed.blocks[i]; if (b.kind === 'clause' && from === undefined) map.push({ num: b.num, title: b.title, page: p + 1 }) }))
    return map
  }, [pages, parsed])

  const tocChunks = useMemo(() => {
    const chunks: (typeof clausePage)[] = []
    for (let i = 0; i < clausePage.length; i += TOC_PER_PAGE) chunks.push(clausePage.slice(i, i + TOC_PER_PAGE))
    return chunks.length ? chunks : [[]]
  }, [clausePage])

  const sheets = useMemo(() => {
    const side = (i: number) => (i % 2 === 0 ? 'recto' : 'verso') as 'recto' | 'verso'
    const list: ((i: number) => ReactNode)[] = []
    list.push(i => (
      <Page key="cover" n={i} side="recto" className="bk-cover">
        <div className="bk-frame" />
        <div className="bk-medal"><img src="/img/logo.png" alt="" /></div>
        <div className="bk-stack">
          <div className="bk-title">{parsed.title.toUpperCase() || 'CONSTITUTION'}</div>
          <span className="bk-gold-rule" />
          <div className="bk-org">{org}</div>
          {parsed.subtitle && <div className="bk-sub2">{parsed.subtitle}</div>}
        </div>
        <div className="bk-ver">
          Version {versionLabel || '—'}<br />
          {status === 'draft' ? 'Draft for trustee approval' : adopted ? `Adopted ${adopted}` : 'Adopted'}
        </div>
      </Page>
    ))
    list.push(i => (
      <Page key="imprint" n={i} side={side(i)}>
        <div className="bk-imprint">
          <strong>{org}</strong>
          {parsed.subtitle || 'A Charitable Incorporated Organisation (Foundation Model)'}<br />
          Registered with the Charity Commission for England and Wales<br />
          Registered charity number <span className="bk-line" /><br />
          Version {versionLabel || '—'}{adopted && status !== 'draft' ? ` · adopted ${adopted}` : status === 'draft' ? ' · draft' : ''}<br />
          <em>This document is the governing document of the CIO.</em>
        </div>
      </Page>
    ))
    tocChunks.forEach((chunk, c) => {
      list.push(i => (
        <Page key={`toc${c}`} n={i} side={side(i)} className={draftClass} run={i % 2 ? [org, ''] : ['', title]} folio={ROMAN[c] ?? String(c + 1)}>
          <div className="bk-body">
            {c === 0 && <div className="bk-toc-h"><div className="bk-kicker">{title}</div><h2>Contents</h2><span className="bk-orn bk-gold-rule" /></div>}
            {chunk.map(cl => (
              <div className="bk-toc" key={cl.num}>
                <span className="bk-tn">{cl.num}</span><span className="bk-tt">{titleCase(cl.title)}</span><span className="bk-dots" /><span className="bk-tp">{cl.page}</span>
              </div>
            ))}
          </div>
        </Page>
      ))
    })
    pages.forEach((idxs, p) => {
      list.push(i => (
        <Page key={`p${p}`} n={i} side={side(i)} className={draftClass} run={i % 2 ? [org, ''] : ['', `${title} · ${versionLabel}`]} folio={String(p + 1)}>
          <div className="bk-body">{idxs.map(pc =>
            pc.from === undefined
              ? <BlockView key={pc.i} b={parsed.blocks[pc.i]} />
              : (
                <div key={`${pc.i}-${pc.from}`} className="bk-piece" style={{ height: (pc.to! - pc.from) * LINE_H + (pc.to === lineCount(pc.i) ? 9 : 0) }}>
                  <div style={{ marginTop: -pc.from * LINE_H }}><BlockView b={parsed.blocks[pc.i]} /></div>
                </div>
              ))}</div>
        </Page>
      ))
    })
    // Pages after the cover must pair into spreads, and the back cover must land on the right.
    if (list.length % 2 === 1) list.push(i => <Page key="notes" n={i} side={side(i)} className={draftClass} run={i % 2 ? [org, ''] : ['', title]}><div className="bk-body" /></Page>)
    list.push(i => (
      <Page key="back" n={i} side="recto" className="bk-back">
        <div className="bk-frame" />
        <div className="bk-medal"><img src="/img/logo.png" alt="" /></div>
        <div className="bk-bt">{org}</div>
      </Page>
    ))
    return list.map((make, i) => make(i))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, lines, parsed, tocChunks, org, title, versionLabel, status, adopted, draftClass])

  const spreads = useMemo(() => {
    if (narrow) return sheets.map(sh => [sh])
    const out: ReactNode[][] = [[sheets[0]]]
    for (let i = 1; i < sheets.length; i += 2) out.push(sheets.slice(i, i + 2))
    return out
  }, [sheets, narrow])

  const current = Math.min(spread, spreads.length - 1)
  const first = current === 0
  const label = first ? 'Cover' : narrow ? `Page ${current + 1}` : `Pages ${current * 2}–${current * 2 + 1}`

  function print() {
    const html = allRef.current?.innerHTML
    if (!html) return
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument!
    doc.open()
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${org} — ${title} ${versionLabel}</title><link rel="stylesheet" href="${FONTS_URL}"><style>${BOOKLET_CSS}${PRINT_CSS}</style></head><body><div class="bk-root bk-print">${html.replaceAll('src="/img/', `src="${location.origin}/img/`)}</div></body></html>`)
    doc.close()
    const go = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 60_000) }
    const ready = (doc.fonts?.ready ?? Promise.resolve()) as Promise<unknown>
    Promise.race([ready, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(go, 150))
  }

  if (!source.trim()) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>Add the constitution text to see the booklet preview.</div>
  }

  return (
    <section className="bk-root" lang="en-GB" aria-label="Booklet preview">
      <style>{BOOKLET_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'system-ui, sans-serif' }}>Booklet preview</h3>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#8a9a8f', fontFamily: 'system-ui, sans-serif' }}>
            A5 booklet, {sheets.length} pages. Updates as you type. Use Print / Save as PDF for a printable copy.
          </p>
        </div>
        <button type="button" style={btn('#1a3c2e')} onClick={print}>Print / Save as PDF</button>
      </div>

      <div className="bk-stage" ref={setStageEl} tabIndex={0}
        onKeyDown={e => { if (e.key === 'ArrowRight') setSpread(Math.min(current + 1, spreads.length - 1)); if (e.key === 'ArrowLeft') setSpread(Math.max(current - 1, 0)) }}>
        <div style={{ position: 'relative', height: PAGE_H * scale + 44 }}>
          <div className="bk-spread" style={{ position: 'absolute', top: 22, left: '50%', width: first || narrow ? PAGE_W : PAGE_W * 2, height: PAGE_H, transform: `translateX(-50%) scale(${scale})` }}>
            {spreads[current]}
          </div>
        </div>
      </div>

      <div className="bk-ctl">
        <button type="button" style={btn('#8a9a8f')} disabled={first} onClick={() => setSpread(current - 1)}>‹ Previous</button>
        <span aria-live="polite">{label} · {current + 1} of {spreads.length}</span>
        <button type="button" style={btn('#8a9a8f')} disabled={current >= spreads.length - 1} onClick={() => setSpread(current + 1)}>Next ›</button>
      </div>

      {/* Off-screen: block heights for pagination, and the full page stack that Print copies. */}
      <div className="bk-measure" ref={measureRef} aria-hidden>
        {parsed.blocks.map((b, i) => <BlockView key={i} b={b} />)}
      </div>
      <div ref={allRef} style={{ display: 'none' }} aria-hidden>{sheets}</div>
    </section>
  )
}
