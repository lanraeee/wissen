'use client'

import { useCallback, useEffect, useState } from 'react'

export interface SavedSignatureItem { id: string; name: string; image_data: string; owner_email: string }

const defaultName = () =>
  `Signature ${new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`

export function useSavedSignatures() {
  const [items, setItems] = useState<SavedSignatureItem[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/signatures')
      if (res.ok) setItems(await res.json())
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  const save = useCallback(async (imageData: string, name = defaultName()) => {
    const res = await fetch('/api/admin/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image_data: imageData }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(d?.error || 'Could not save signature')
    await reload()
    return d as SavedSignatureItem
  }, [reload])

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/signatures?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d?.error || 'Could not delete signature')
    }
    await reload()
  }, [reload])

  return { items, loaded, reload, save, remove }
}
