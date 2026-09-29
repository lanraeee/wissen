import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
    // Imported inline here rather than at the top of the file or through a
    // local helper, so the edge build can drop it: webpack keeps whatever a
    // module's import graph can reach regardless of the runtime guard around
    // it, and this graph pulls in the schema snapshot, the database client
    // and the logger -- measured at +47 kB on the edge middleware bundle,
    // paid on every middleware-matched request, for code edge never runs.
    const { reportSchemaDrift } = await import('./lib/startup-schema-check')
    await reportSchemaDrift()
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
