'use client'

import { useState } from 'react'
import SignatureCanvas from './cio/SignatureCanvas'
import { useSavedSignatures } from './cio/useSavedSignatures'

const field = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6 } as const
const small = { padding: '6px 14px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: '#8a9a8f', color: '#fff', border: 'none', cursor: 'pointer' } as const

// Chooses one entry from the saved-signature library by id. Used where a
// signature is stored as a setting (certificate signatories) rather than
// applied to a single printout.
export default function SignatureSelect({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const lib = useSavedSignatures()
  const [drawing, setDrawing] = useState(false)
  const selected = lib.items.find(i => i.id === value)

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select aria-label="Signature image" value={value ?? ''} onChange={e => onChange(e.target.value)} style={field}>
          <option value="">No signature image (typed name only)</option>
          {value && !selected && lib.loaded && <option value={value}>Saved signature (belongs to another user)</option>}
          {lib.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <button type="button" style={small} onClick={() => setDrawing(d => !d)}>{drawing ? 'Close pad' : 'Draw new'}</button>
      </div>
      {selected && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={selected.image_data} alt="Selected signature" style={{ marginTop: 8, maxHeight: 56, maxWidth: 240, border: '1px solid #e2ddd0', borderRadius: 6, background: '#fff', display: 'block' }} />
      )}
      {drawing && (
        <div style={{ marginTop: 12 }}>
          <SignatureCanvas
            submitLabel="Save & use"
            onDone={async dataUrl => {
              const item = await lib.save(dataUrl)
              onChange(item.id)
              setDrawing(false)
            }}
            onCancel={() => setDrawing(false)}
          />
        </div>
      )}
    </div>
  )
}
