import sql from './db'
import { SCHEMA_SQL } from './schema-snapshot'

// Guards against the failure that took page-view tracking down for three
// days in Sep 2026: this repo has no migration framework (see
// docs/adr/001-neon-postgres.md) -- lib/schema.sql is applied by hand with
// `node scripts/migrate.mjs`. Deploying code that reads or writes a column
// before that run happens leaves the two out of step, and the resulting
// "column does not exist" error surfaces only wherever that query lived.
//
// This compares what schema.sql declares against what the database actually
// has, so the drift is reported once at startup rather than discovered later
// through whatever broke.

export interface SchemaDrift {
  missingTables: string[]
  missingColumns: { table: string; column: string }[]
}

/** Line starts that introduce a table constraint rather than a column. */
const CONSTRAINT_KEYWORDS = new Set([
  'primary', 'foreign', 'unique', 'check', 'constraint', 'exclude', 'like',
])

/**
 * Extracts table -> columns from the CREATE TABLE and ALTER TABLE ... ADD
 * COLUMN statements in schema.sql. Deliberately a small, forgiving parser
 * rather than a real SQL one: it only needs identifiers, and anything it
 * fails to recognise is simply not checked.
 */
export function parseExpectedSchema(sqlText: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>()

  // Table bodies close with `\n);`, which nested parens -- NUMERIC(12,2),
  // gen_random_uuid(), CHECK (x IN ('a','b')) -- never produce.
  const createRe = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/gi
  for (const match of sqlText.matchAll(createRe)) {
    const [, table, body] = match
    const columns = new Set<string>()
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('--')) continue
      const first = line.split(/[\s(]/)[0].toLowerCase()
      if (CONSTRAINT_KEYWORDS.has(first)) continue
      if (/^\w+$/.test(first)) columns.add(first)
    }
    tables.set(table.toLowerCase(), columns)
  }

  // Columns added after a table first shipped, e.g.
  // `ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_id UUID …`.
  // Commented-out examples are skipped: the line-start anchor with the `m`
  // flag will not match a line beginning with `--`.
  const alterRe = /^\s*ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)/gim
  for (const match of sqlText.matchAll(alterRe)) {
    const table = match[1].toLowerCase()
    const column = match[2].toLowerCase()
    if (!tables.has(table)) tables.set(table, new Set())
    tables.get(table)!.add(column)
  }

  return tables
}

/** Diffs the declared schema against what the database reports. Extra tables/columns in the database are ignored -- only things the code expects and cannot find will break it. */
export function diffSchema(
  expected: Map<string, Set<string>>,
  actual: Map<string, Set<string>>
): SchemaDrift {
  const missingTables: string[] = []
  const missingColumns: { table: string; column: string }[] = []

  for (const [table, columns] of expected) {
    const actualColumns = actual.get(table)
    if (!actualColumns) {
      missingTables.push(table)
      continue
    }
    for (const column of columns) {
      if (!actualColumns.has(column)) missingColumns.push({ table, column })
    }
  }

  return { missingTables, missingColumns }
}

export function hasDrift(drift: SchemaDrift): boolean {
  return drift.missingTables.length > 0 || drift.missingColumns.length > 0
}

/** Human-readable one-liner for logs and the admin banner. */
export function describeDrift(drift: SchemaDrift): string {
  const parts: string[] = []
  if (drift.missingTables.length) parts.push(`missing tables: ${drift.missingTables.join(', ')}`)
  if (drift.missingColumns.length) {
    parts.push(`missing columns: ${drift.missingColumns.map(c => `${c.table}.${c.column}`).join(', ')}`)
  }
  return parts.join(' · ')
}

async function readActualSchema(): Promise<Map<string, Set<string>>> {
  const rows = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `
  const actual = new Map<string, Set<string>>()
  for (const row of rows) {
    const table = String(row.table_name).toLowerCase()
    if (!actual.has(table)) actual.set(table, new Set())
    actual.get(table)!.add(String(row.column_name).toLowerCase())
  }
  return actual
}

/**
 * Compares the declared schema against the live database.
 *
 * Reads schema.sql through the generated lib/schema-snapshot.ts rather than
 * with `fs`, so this module works on any runtime: instrumentation.ts is
 * compiled for edge as well as node, and webpack resolves an import graph
 * whether or not a runtime guard would execute it -- a stray `fs` import
 * reachable from there fails the edge build outright.
 *
 * Returns null when the check could not run at all (most likely the
 * database was unreachable) -- an inconclusive check must not be reported
 * as "no drift", and must never take the app down.
 */
export async function checkSchemaDrift(): Promise<SchemaDrift | null> {
  try {
    const expected = parseExpectedSchema(SCHEMA_SQL)
    if (expected.size === 0) return null
    return diffSchema(expected, await readActualSchema())
  } catch {
    return null
  }
}
