'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('wh_sid')
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem('wh_sid', id)
    }
    return id
  } catch {
    return ''
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname

    const params = new URLSearchParams(window.location.search)

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathname,
        referrer: document.referrer || null,
        session_id: getSessionId(),
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null,
      }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
