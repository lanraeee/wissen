import * as Sentry from '@sentry/nextjs'

type Level = 'info' | 'warn' | 'error'

interface LogEntry {
  level: Level
  route: string
  message: string
  time: string
  duration_ms?: number
  error?: { name: string; message: string; stack?: string }
  [key: string]: unknown
}

function write(entry: LogEntry) {
  const line = JSON.stringify(entry)
  if (entry.level === 'error') console.error(line)
  else if (entry.level === 'warn') console.warn(line)
  else console.log(line)
}

function errorFields(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack }
  return { name: 'UnknownError', message: String(err) }
}

/**
 * Structured (JSON-line) logging for API routes, replacing ad hoc
 * console.error('[tag]', err) calls with a consistent shape that's easy to
 * grep or feed into a log pipeline: level, route, message, timestamp, and
 * (for errors) name/message/stack.
 *
 * error() also forwards to Sentry.captureException — inert until SENTRY_DSN
 * is set (see instrumentation.ts), so this is safe to call unconditionally.
 */
export const log = {
  info(route: string, message: string, meta: Record<string, unknown> = {}) {
    write({ level: 'info', route, message, time: new Date().toISOString(), ...meta })
  },
  warn(route: string, message: string, meta: Record<string, unknown> = {}) {
    write({ level: 'warn', route, message, time: new Date().toISOString(), ...meta })
  },
  error(route: string, err: unknown, meta: Record<string, unknown> = {}) {
    write({ level: 'error', route, message: errorFields(err).message, time: new Date().toISOString(), error: errorFields(err), ...meta })
    Sentry.captureException(err, { tags: { route } })
  },
}
