// Client-side Sentry init. Inert unless NEXT_PUBLIC_SENTRY_DSN is set --
// no DSN means Sentry.init() runs with dsn: undefined, which the SDK
// treats as "disabled" (no network calls, no overhead).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Session replay is opt-in extra volume; keep it off until explicitly wanted.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})
