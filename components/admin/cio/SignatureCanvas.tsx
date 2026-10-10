'use client'

import { useEffect, useRef, useState } from 'react'
import { btn } from '../cio-ui'

interface Props {
  submitLabel: string
  onDone: (dataUrl: string) => Promise<void>
  onCancel?: () => void
}

// Drawing surface shared by every place a signature is captured. Pointer
// events cover mouse, touch and pen in one handler set.
export default function SignatureCanvas({ submitLabel, onDone, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const empty = useRef(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function reset() {
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
  }

  useEffect(reset, [])

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
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

  async function submit() {
    if (empty.current) { setError('Draw a signature first.'); return }
    setBusy(true)
    setError('')
    try {
      await onDone(canvasRef.current!.toDataURL('image/png'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save signature')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {error && <div role="alert" style={{ marginBottom: 10, color: '#dc2626', fontSize: '.82rem', background: '#fee2e2', padding: '6px 12px', borderRadius: 6 }}>{error}</div>}
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        style={{ width: '100%', maxWidth: 420, height: 140, border: '1px solid #d0ccc4', borderRadius: 6, background: '#fff', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button type="button" style={btn('#8a9a8f')} onClick={reset} disabled={busy}>Clear</button>
        <button type="button" style={btn('#1a3c2e')} onClick={submit} disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" style={btn('#8a9a8f')} onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
    </div>
  )
}
