'use client'

import { useState } from 'react'
import { btn } from '../cio-ui'
import SignatureCanvas from './SignatureCanvas'
import { useSavedSignatures } from './useSavedSignatures'

interface Props {
  resource: string
  recordId: string
  existing: string | null
  onSaved: () => Promise<void>
}

// Simple electronic signature -- a drawn PNG, same legal standing as a
// typed name (no identity verification or audit trail). See the note on
// cio_trustee_declarations.signature_data in lib/schema.sql for why that's
// an acceptable tradeoff here. A drawn signature can also be kept in the
// user's saved-signature library and reused here or on other documents.
export default function SignaturePad({ resource, recordId, existing, onSaved }: Props) {
  const [redraw, setRedraw] = useState(!existing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lib = useSavedSignatures()

  async function persist(dataUrl: string) {
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
  }

  async function onDraw(dataUrl: string, saveName: string | null) {
    if (saveName) await lib.save(saveName, dataUrl)
    await persist(dataUrl)
  }

  async function applySaved(id: string) {
    const item = lib.items.find(i => i.id === id)
    if (!item) return
    setBusy(true)
    setError('')
    try { await persist(item.image_data) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not apply signature') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '.95rem' }}>Signature</h3>
      <p style={{ margin: '0 0 12px', fontSize: '.78rem', color: '#8a9a8f' }}>
        Draw with mouse, finger or stylus, or pick one you saved earlier. This is a simple electronic signature -- it appears on the printed declaration but carries no identity verification.
      </p>

      {error && <div role="alert" style={{ marginBottom: 10, color: '#dc2626', fontSize: '.82rem', background: '#fee2e2', padding: '6px 12px', borderRadius: 6 }}>{error}</div>}

      {redraw ? (
        <>
          {lib.items.length > 0 && (
            <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '.8rem' }}>Use a saved signature:</label>
              <select
                defaultValue=""
                disabled={busy}
                onChange={e => { if (e.target.value) void applySaved(e.target.value) }}
                style={{ padding: '6px 10px', fontSize: '.82rem', border: '1px solid #d0ccc4', borderRadius: 6 }}
              >
                <option value="">Choose…</option>
                {lib.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}
          <SignatureCanvas
            submitLabel="Save signature"
            onDone={onDraw}
            onCancel={existing ? () => setRedraw(false) : undefined}
          />
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={existing!} alt="Signature" style={{ maxWidth: 300, maxHeight: 110, border: '1px solid #d0ccc4', borderRadius: 6, background: '#fff', display: 'block' }} />
          <button type="button" style={{ ...btn('#8a9a8f'), marginTop: 10 }} onClick={() => setRedraw(true)}>Clear &amp; redraw / change</button>
        </>
      )}
    </div>
  )
}
