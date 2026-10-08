'use client'

import { Fragment, useEffect, useMemo, useRef } from 'react'
import { parseMinutes, type MinutesBlock } from '@/lib/minutes-render'
import type { Run } from '@/lib/constitution-render'
import { btn, fmtDate, humanise } from '../cio-ui'
import { MINUTES_CSS, MINUTES_PRINT_CSS, FONTS_URL } from './minutes-css'

interface Props {
  title: string
  category?: string | null
  status: string
  adoptedDate?: unknown
  reviewDate?: unknown
  owner?: string | null
  bodyText: string
  orgName?: string
}

// Same numbered-heading/paragraph parser as the Minutes preview -- a policy
// document ("1. Purpose", "2. Scope", "2.1 ...") is the same shape of
// formal text, so it gets the same forgiving parser rather than a second
// one. Unlike minutes, there is no RESOLVED/DEFERRED language to tag, so
// this renders plain Runs with no keyword pills.
const Runs = ({ runs }: { runs: Run[] }) => (
  <>{runs.map((r, i) => (r.b ? <strong key={i}>{r.t}</strong> : r.i ? <em key={i}>{r.t}</em> : <Fragment key={i}>{r.t}</Fragment>))}</>
)

function BlockView({ b }: { b: MinutesBlock }) {
  switch (b.kind) {
    case 'heading':
      return <div className="mn-heading"><span className="mn-hn">{b.num}.</span><span>{b.title}</span></div>
    case 'para':
      return <div className="mn-para"><span className="mn-n">{b.num}</span><span><Runs runs={b.runs} /></span></div>
    case 'plain':
      return <div className="mn-plain"><Runs runs={b.runs} /></div>
  }
}

export default function PolicyPreview({ title, category, status, adoptedDate, reviewDate, owner, bodyText, orgName = 'Wissen Haus Foundation' }: Props) {
  const blocks = useMemo(() => parseMinutes(bodyText), [bodyText])
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!document.getElementById('mn-fonts')) {
      const link = document.createElement('link')
      link.id = 'mn-fonts'
      link.rel = 'stylesheet'
      link.href = FONTS_URL
      document.head.appendChild(link)
    }
  }, [])

  function print() {
    const html = sheetRef.current?.outerHTML
    if (!html) return
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument!
    doc.open()
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${orgName} — ${title || 'Policy'}</title><link rel="stylesheet" href="${FONTS_URL}"><style>${MINUTES_CSS}${MINUTES_PRINT_CSS}</style></head><body><div class="mn-root mn-print">${html}</div></body></html>`)
    doc.close()
    const go = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 60_000) }
    const ready = (doc.fonts?.ready ?? Promise.resolve()) as Promise<unknown>
    Promise.race([ready, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(go, 150))
  }

  if (!bodyText.trim()) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>Add the policy text to see the document preview.</div>
  }

  const metaBits = [
    category || null,
    humanise(status),
    adoptedDate ? `adopted ${fmtDate(adoptedDate as never)}` : null,
    reviewDate ? `next review ${fmtDate(reviewDate as never)}` : null,
  ].filter(Boolean)

  return (
    <section className="mn-root" lang="en-GB" aria-label="Policy preview">
      <style>{MINUTES_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'system-ui, sans-serif' }}>Policy preview</h3>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#8a9a8f', fontFamily: 'system-ui, sans-serif' }}>
            Updates as you type. Use Print / Save as PDF for a printable copy.
          </p>
        </div>
        <button type="button" style={btn('#1a3c2e')} onClick={print}>Print / Save as PDF</button>
      </div>

      <div className="mn-stage">
        <div className="mn-sheet" ref={sheetRef}>
          <div className="mn-head">
            <div className="mn-org">{orgName}</div>
            <div className="mn-kicker">Policy</div>
            <div className="mn-title">{title || 'Untitled policy'}</div>
            <div className="mn-meta">{metaBits.join(' · ')}</div>
          </div>

          {owner && <div className="mn-plain" style={{ marginBottom: 16 }}><strong>Owner:</strong> {owner}</div>}

          {blocks.map((b, i) => <BlockView key={i} b={b} />)}
        </div>
      </div>
    </section>
  )
}
