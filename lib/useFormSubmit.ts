'use client'

import { useState, FormEvent } from 'react'
import posthog from 'posthog-js'

export type FormStatus = 'idle' | 'sending' | 'done' | 'error'

interface UseFormSubmitOptions<T> {
  endpoint: string
  /** Builds the JSON request body from the submitted form's FormData. */
  buildPayload: (fd: FormData) => T
  /** PostHog event name to capture on success. */
  event?: string
  /** Extra PostHog event properties, derived from the same FormData. */
  eventProperties?: (fd: FormData) => Record<string, unknown>
}

/**
 * Encapsulates the "POST a form as JSON, track success, surface errors"
 * pattern shared by every public form on the site (contact, partner,
 * volunteer, ...). Each form still owns its own fields and success copy --
 * this only factors out the submit plumbing.
 */
export function useFormSubmit<T>({ endpoint, buildPayload, event, eventProperties }: UseFormSubmitOptions<T>) {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(fd)),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong')
      }
      if (event) posthog.capture(event, eventProperties?.(fd))
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return { status, error, handleSubmit }
}
