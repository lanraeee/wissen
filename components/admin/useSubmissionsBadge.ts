'use client'

import { useEffect, useState } from 'react'

const POLL_MS = 60_000

/** Pending counts per admin resource, refreshed periodically for nav badges. */
export function useSubmissionsBadge() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    function load() {
      fetch('/api/admin/inbox-counts')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (!cancelled && d) setCounts(d) })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return counts
}

export function totalCount(counts: Record<string, number>) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0)
}
