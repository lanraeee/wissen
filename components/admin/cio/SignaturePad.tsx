'use client'

import { useEffect, useRef, useState } from 'react'
import { btn } from '../cio-ui'

interface Props {
  resource: string
  recordId: string
  existing: string | null
  onSaved: () => Promise<void>
}

// Simple electronic signature -- a drawn PNG, same legal standing as a
// typed name (no identity verification or audit trail). See the note on
// cio_trustee_declarations.signature_data in lib/schema.sql for why that's
// an acceptable tradeoff here. Pointer events cover mouse, touch and pen
// in one handler set, so this needs no drawing library.
export default function SignaturePad({ resource, recordId, existing, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const empty = useRef(true)
  const [redraw, setRedraw] = useState(!existing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!redraw) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1d1d1b'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    empty.current = true
  }, [redraw])

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    const p = point(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    empty.current = false
  }

  function end() { drawing.current = false }

  function clear() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    empty.current = true
    setError('')
  }

  async function save() {
    if (empty.current) { setError('Draw a signature first.'); return }
    setSaving(true)
    setError('')
    try {
      const dataUrl = canvasRef.current!.toDataURL('image/png')
      const res = await fetch(`/api/admin/whf-cio/${resource}/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data: dataUrl }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Could not save signature')
      }
      await onSaved()
      setRedraw(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save signature')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '.95rem' }}>Signature</h3>
      <p style={{ margin: '0 0 12px', fontSize: '.78rem', color: '#8a9a8f' }}>
        Draw with mouse, finger or stylus. This is a simple electronic signature -- it appears on the printed declaration but carries no identity verification.
      </p>

      {error && <div role="alert" style={{ marginBottom: 10, color: '#dc2626', fontSize: '.82rem', background: '#fee2e2', padding: '6px 12px', borderRadius: 6 }}>{error}</div>}

      {redraw ? (
        <>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            style={{ width: '100%', maxWidth: 420, height: 140, border: '1px solid #d0ccc4', borderRadius: 6, background: '#fff', touchAction: 'none', cursor: 'crosshair' }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" style={btn('#8a9a8f')} onClick={clear} disabled={saving}>Clear</button>
            <button type="button" style={btn('#1a3c2e')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save signature'}</button>
            {existing && <button type="button" style={btn('#8a9a8f')} onClick={() => setRedraw(false)} disabled={saving}>Cancel</button>}
          </div>
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={existing!} alt="Signature" style={{ maxWidth: 300, maxHeight: 110, border: '1px solid #d0ccc4', borderRadius: 6, background: '#fff', display: 'block' }} />
          <button type="button" style={{ ...btn('#8a9a8f'), marginTop: 10 }} onClick={() => setRedraw(true)}>Clear &amp; redraw</button>
        </>
      )}
    </div>
  )
}
