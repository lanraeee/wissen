'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { parseMinutes, RESOLVED_RE, OPEN_RE, type MinutesBlock } from '@/lib/minutes-render'
import type { Run } from '@/lib/constitution-render'
import { btn, fmtDate, humanise } from '../cio-ui'
import SignatureChooser, { NO_SIGNATURE, type SignatureChoice } from './SignatureChooser'
import { MINUTES_CSS, MINUTES_PRINT_CSS, FONTS_URL } from './minutes-css'

interface Props {
  title: string
  meetingDate: unknown
  meetingType: string
  status: string
  attendees: string
  minutes: string
  orgName?: string
}

// A line of the Attendees & Apologies field is either a labelled roster line
// ("Present (trustees): ...") or a bare continuation -- same forgiving split
// used for the minutes body, so a differently formatted entry still renders.
function Roster({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <div className="mn-roster">
      {lines.map((line, i) => {
        const m = line.match(/^([A-Za-z][A-Za-z \/()-]{2,40}):\s*(.*)$/)
        return m
          ? <Fragment key={i}><span className="mn-rk">{m[1]}</span>{m[2]}</Fragment>
          : <div key={i}>{line}</div>
      })}
    </div>
  )
}

function Tagged({ text }: { text: string }) {
  if (RESOLVED_RE.test(text)) return <><span className="mn-tag mn-resolved">Resolved</span>{text.replace(RESOLVED_RE, '').replace(/^:\s*/, '')}</>
  const open = text.match(OPEN_RE)
  if (open) return <><span className="mn-tag mn-open">{humanise(open[1].toLowerCase())}</span>{text.replace(OPEN_RE, '').replace(/^:\s*/, '')}</>
  return <>{text}</>
}

const Runs = ({ runs }: { runs: Run[] }) => (
  <>{runs.map((r, i) => {
    const content = <Tagged text={r.t} />
    return r.b ? <strong key={i}>{content}</strong> : r.i ? <em key={i}>{content}</em> : <Fragment key={i}>{content}</Fragment>
  })}</>
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

export default function MinutesPreview({ title, meetingDate, meetingType, status, attendees, minutes, orgName = 'Wissen Haus Foundation' }: Props) {
  const blocks = useMemo(() => parseMinutes(minutes), [minutes])
  const sheetRef = useRef<HTMLDivElement>(null)
  const [sig, setSig] = useState<SignatureChoice>(NO_SIGNATURE)

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
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${orgName} — ${title || 'Minutes'}</title><link rel="stylesheet" href="${FONTS_URL}"><style>${MINUTES_CSS}${MINUTES_PRINT_CSS}</style></head><body><div class="mn-root mn-print">${html}</div></body></html>`)
    doc.close()
    const go = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 60_000) }
    const ready = (doc.fonts?.ready ?? Promise.resolve()) as Promise<unknown>
    Promise.race([ready, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(go, 150))
  }

  if (!minutes.trim()) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>Add the minutes text to see the document preview.</div>
  }

  return (
    <section className="mn-root" lang="en-GB" aria-label="Minutes preview">
      <style>{MINUTES_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'system-ui, sans-serif' }}>Minutes preview</h3>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#8a9a8f', fontFamily: 'system-ui, sans-serif' }}>
            Updates as you type. Use Print / Save as PDF for a signable copy.
          </p>
        </div>
        <button type="button" style={btn('#1a3c2e')} onClick={print}>Print / Save as PDF</button>
      </div>

      <SignatureChooser value={sig} onChange={setSig} label="Apply the chair's saved signature and date when printing" />

      <div className="mn-stage">
        <div className="mn-sheet" ref={sheetRef}>
          <div className="mn-head">
            <div className="mn-org">{orgName}</div>
            <div className="mn-kicker">Minutes of Meeting</div>
            <div className="mn-title">{title || 'Untitled meeting'}</div>
            <div className="mn-meta">{fmtDate(meetingDate as never)} · {meetingType} · {humanise(status)}</div>
          </div>

          <Roster text={attendees} />

          {blocks.map((b, i) => <BlockView key={i} b={b} />)}

          <div className="mn-sigrow">
            <div className="mn-sigblock">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {sig.image ? <img className="mn-sig-img" src={sig.image} alt="Chair's signature" /> : <div className="mn-sigline" />}
              <div className="mn-sigcap">Chair&apos;s signature</div>
            </div>
            <div className="mn-sigblock">
              {sig.date ? <div className="mn-sigdate">{fmtDate(sig.date as never)}</div> : null}
              <div className="mn-sigline" style={sig.date ? { marginTop: 0 } : undefined} />
              <div className="mn-sigcap">Date</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
