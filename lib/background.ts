import { after } from 'next/server'

/**
 * Runs background work (e.g. sending an email) after the response has been
 * sent, without making the caller wait for it. Wraps next/server's after()
 * because a bare fire-and-forget promise isn't guaranteed to survive past
 * the point the response is sent on Vercel's serverless runtime -- that was
 * silently dropping some emails with nothing ever logged.
 *
 * after() throws when called outside a real Next.js request scope, which
 * this codebase's route tests do (they call the exported handler function
 * directly, not through Next's server). Falling back to firing the
 * callback immediately there matches the previous fire-and-forget
 * behavior instead of failing the whole request.
 */
export function runAfterResponse(fn: () => void | Promise<unknown>) {
  try {
    after(fn)
  } catch {
    fn()
  }
}
