'use client'

import { useEffect, useRef } from 'react'
import { btn, fmtDate } from '../cio-ui'
import { MINUTES_CSS, MINUTES_PRINT_CSS, FONTS_URL } from './minutes-css'

interface Props {
  fullName: string
  positionTitle?: string | null
  signedDate: unknown
  confirmsEligible: boolean
  acceptsOffice: boolean
  consentsToApplication: boolean
  signedName?: string | null
  orgName?: string
}

const STATEMENTS = [
  {
    key: 'confirmsEligible' as const,
    text: 'I confirm that I am not disqualified from acting as a charity trustee under sections 178–180 of the Charities Act 2011 (including an unspent conviction for a relevant offence, an unreleased bankruptcy or individual voluntary arrangement, or disqualification as a company director), and that I will tell the other trustees immediately if this changes.',
  },
  {
    key: 'acceptsOffice' as const,
    text: 'I accept appointment as a charity trustee of Wissen Haus Foundation and agree to act in accordance with its constitution and with my duties as a trustee.',
  },
  {
    key: 'consentsToApplication' as const,
    text: 'I consent to my details being used for the Charity Commission application and the Register of Charities, and to the other trustees holding and processing them for the charity’s governance records.',
  },
]

function Pill({ ok }: { ok: boolean }) {
  return <span className={`mn-tag ${ok ? 'mn-resolved' : 'mn-open'}`}>{ok ? 'Confirmed' : 'Not yet confirmed'}</span>
}

export default function TrusteeDeclarationPreview({
  fullName, positionTitle, signedDate, confirmsEligible, acceptsOffice, consentsToApplication, signedName, orgName = 'Wissen Haus Foundation',
}: Props) {
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
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${orgName} — Trustee Declaration — ${fullName}</title><link rel="stylesheet" href="${FONTS_URL}"><style>${MINUTES_CSS}${MINUTES_PRINT_CSS}</style></head><body><div class="mn-root mn-print">${html}</div></body></html>`)
    doc.close()
    const go = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 60_000) }
    const ready = (doc.fonts?.ready ?? Promise.resolve()) as Promise<unknown>
    Promise.race([ready, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(go, 150))
  }

  const flags = { confirmsEligible, acceptsOffice, consentsToApplication }

  return (
    <section className="mn-root" lang="en-GB" aria-label="Trustee declaration preview">
      <style>{MINUTES_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'system-ui, sans-serif' }}>Declaration preview</h3>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#8a9a8f', fontFamily: 'system-ui, sans-serif' }}>
            Updates as you type. Use Print / Save as PDF for the trustee to sign.
          </p>
        </div>
        <button type="button" style={btn('#1a3c2e')} onClick={print}>Print / Save as PDF</button>
      </div>

      <div className="mn-stage">
        <div className="mn-sheet" ref={sheetRef}>
          <div className="mn-head">
            <div className="mn-org">{orgName}</div>
            <div className="mn-kicker">Trustee Declaration</div>
            <div className="mn-title">{fullName || 'Untitled trustee'}</div>
            <div className="mn-meta">{positionTitle || 'Trustee'} · signed {fmtDate(signedDate as never)}</div>
          </div>

          <div className="mn-plain" style={{ marginBottom: 16 }}>
            Eligibility and acceptance-of-office declaration, given on appointment as a charity trustee of Wissen Haus Foundation (constitution clauses 4.3 and 5.2.5).
          </div>

          {STATEMENTS.map((s, i) => (
            <div key={s.key} className="mn-para" style={{ marginBottom: 12 }}>
              <span className="mn-n">{i + 1}.</span>
              <span><Pill ok={flags[s.key]} /><br />{s.text}</span>
            </div>
          ))}

          {signedName && <div className="mn-plain" style={{ marginTop: 8 }}>Signed name on file: <strong>{signedName}</strong></div>}

          <div className="mn-sigrow">
            <div className="mn-sigblock"><div className="mn-sigline" /><div className="mn-sigcap">Trustee&apos;s signature</div></div>
            <div className="mn-sigblock"><div className="mn-sigline" /><div className="mn-sigcap">Date</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
