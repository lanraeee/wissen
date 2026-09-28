'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  function refresh() {
    setRefreshing(true)
    router.refresh()
    // router.refresh() re-runs this page's server-side data fetching (a fresh
    // read of page_views etc.) without a hard reload; there's no completion
    // callback, so just give the spinner a moment to be visible.
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <button
      onClick={refresh}
      disabled={refreshing}
      style={{
        padding: '7px 14px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600,
        background: '#1a3c2e', color: '#fff', border: 'none', cursor: refreshing ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, opacity: refreshing ? 0.75 : 1,
      }}
    >
      <svg
        viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
      {refreshing ? 'Refreshing…' : 'Refresh Data'}
    </button>
  )
}
