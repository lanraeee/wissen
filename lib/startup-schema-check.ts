import * as Sentry from '@sentry/nextjs'
import { checkSchemaDrift, hasDrift, describeDrift } from './schema-check'
import { log } from './logger'

/**
 * Warns once per server start when lib/schema.sql declares tables or columns
 * the database does not have.
 *
 * There is no migration framework here (docs/adr/001-neon-postgres.md):
 * schema.sql is applied by hand with `node scripts/migrate.mjs`. Deploying
 * code that reads or writes a new column before that run leaves the two out
 * of step, and the failure surfaces only wherever that query lived -- in
 * Sep 2026 that was the analytics tracker, whose caller discards errors, so
 * page views silently stopped recording for three days.
 *
 * Lives in its own module, imported from instrumentation.ts only inside the
 * `NEXT_RUNTIME === 'nodejs'` branch: that lets the edge build drop it
 * entirely. Importing it at instrumentation's top level, or from a helper
 * the guard calls, pulls this whole graph (schema snapshot, database client,
 * Sentry) into the edge middleware bundle -- measured at +47 kB on every
 * middleware-matched request, for code the edge never executes.
 *
 * Deliberately non-blocking and never throwing: a database that is slow or
 * briefly unreachable at boot must not stop the server from starting, and an
 * inconclusive check stays quiet rather than crying wolf.
 */
export async function reportSchemaDrift(): Promise<void> {
  // Nothing to compare during `next build`, and no reason to make the build
  // depend on a reachable database.
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  if (!process.env.WISSENDB_DATABASE_URL && !process.env.DATABASE_URL) return

  try {
    const drift = await checkSchemaDrift()
    if (!drift || !hasDrift(drift)) return

    log.warn(
      'schema-check',
      `Database is behind lib/schema.sql — run: node scripts/migrate.mjs (${describeDrift(drift)})`,
      {
        missingTables: drift.missingTables,
        missingColumns: drift.missingColumns.map(c => `${c.table}.${c.column}`),
      }
    )
    Sentry.captureMessage('Database schema drift detected', {
      level: 'warning',
      tags: { route: 'schema-check' },
      extra: { missingTables: drift.missingTables, missingColumns: drift.missingColumns },
    })
  } catch {
    // Checking the schema is a diagnostic. If the diagnostic itself fails,
    // that must not be what takes the application down.
  }
}
