'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24,
        }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong.</h1>
          <p style={{ color: '#666', margin: 0 }}>We&apos;ve been notified and are looking into it.</p>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: '#1a3c2e', color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
