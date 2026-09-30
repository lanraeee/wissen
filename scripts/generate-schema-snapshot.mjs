import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Embeds lib/schema.sql into a TypeScript module so the startup drift check
// (instrumentation.ts) can read it without `fs`. instrumentation.ts is
// compiled for the edge runtime as well as node, and webpack resolves an
// import graph whether or not a runtime guard would execute it -- so any
// `fs` reachable from there fails the edge build outright.
//
// Runs automatically on every build via the `prebuild` npm script, so the
// snapshot cannot drift from schema.sql; lib/schema-snapshot.test.ts fails
// if it ever does.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Normalise line endings before embedding. Git rewrites schema.sql's newlines
// on checkout (CRLF on Windows, LF elsewhere), so without this the generated
// snapshot's bytes depend on which machine last ran the build -- and
// schema-snapshot.test.ts, which compares them byte for byte, fails on a
// fresh clone or in CI for a reason that has nothing to do with the schema.
// The drift check only ever parses this text, so the newline style is not
// information worth preserving.
const sqlText = readFileSync(join(root, 'lib', 'schema.sql'), 'utf-8').replace(/\r\n/g, '\n')

const out = `// GENERATED FILE -- do not edit by hand.
// Regenerate with: npm run schema:snapshot (runs automatically on build).
// Source: lib/schema.sql

export const SCHEMA_SQL: string = ${JSON.stringify(sqlText)}
`

const target = join(root, 'lib', 'schema-snapshot.ts')
writeFileSync(target, out, 'utf-8')
console.log(`✓ Wrote lib/schema-snapshot.ts (${sqlText.length} chars from lib/schema.sql)`)
