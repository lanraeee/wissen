'use client'

import { useState } from 'react'
import { btn } from '../cio-ui'
import SignatureCanvas from './SignatureCanvas'
import { useSavedSignatures } from './useSavedSignatures'

export interface SignatureChoice { image: string | null; date: string }
export const NO_SIGNATURE: SignatureChoice = { image: null, date: '' }

interface Props {
  value: SignatureChoice
  onChange: (v: SignatureChoice) => void
  label?: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

// Picks a saved signature (or draws and saves a new one) and a signing date
// to overlay on a printed document. The choice is not stored on the record;
// it only affects what Print / Save as PDF produces.
export default function SignatureChooser({ value, onChange, label = 'Apply a signature to the printout' }: Props) {
  const lib = useSavedSignatures()
  const [drawing, setDrawing] = useState(false)
  const [error, setError] = useState('')
  const selected = lib.items.find(i => i.image_data === value.image)

  async function onDraw(dataUrl: string, saveName: string | null) {
    if (saveName) await lib.save(saveName, dataUrl)
    onChange({ ...value, image: dataUrl })
    setDrawing(false)
  }

  async function removeSelected() {
    if (!selected || !window.confirm(`Delete the saved signature "${selected.name}"?`)) return
    setError('')
    try {
      await lib.remove(selected.id)
      onChange({ ...value, image: null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete signature')
    }
  }

  const field = { padding: '6px 10px', fontSize: '.82rem', border: '1px solid #d0ccc4', borderRadius: 6 } as const

  return (
    <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 12, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {error && <div role="alert" style={{ marginBottom: 8, color: '#dc2626', fontSize: '.8rem' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          aria-label="Saved signature"
          value={selected?.id ?? (value.image ? '__drawn' : '')}
          onChange={e => {
            const item = lib.items.find(i => i.id === e.target.value)
            onChange({ ...value, image: item ? item.image_data : null })
          }}
          style={field}
        >
          <option value="">No signature (blank line)</option>
          {value.image && !selected && <option value="__drawn">Drawn just now (not saved)</option>}
          {lib.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <label style={{ fontSize: '.8rem', display: 'flex', gap: 6, alignItems: 'center' }}>
          Date
          <input type="date" value={value.date} onChange={e => onChange({ ...value, date: e.target.value })} style={field} />
        </label>
        <button type="button" style={btn('#8a9a8f')} onClick={() => onChange({ ...value, date: todayIso() })}>Today</button>
        <button type="button" style={btn('#8a9a8f')} onClick={() => setDrawing(d => !d)}>{drawing ? 'Close pad' : 'Draw new'}</button>
        {selected && <button type="button" style={btn('#b04a3a')} onClick={removeSelected}>Delete saved</button>}
      </div>
      {value.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.image} alt="Selected signature" style={{ marginTop: 10, maxHeight: 56, maxWidth: 240, border: '1px solid #e2ddd0', borderRadius: 6, background: '#fff', display: 'block' }} />
      )}
      {drawing && (
        <div style={{ marginTop: 12 }}>
          <SignatureCanvas submitLabel="Use signature" onDone={onDraw} onCancel={() => setDrawing(false)} />
        </div>
      )}
    </div>
  )
}
