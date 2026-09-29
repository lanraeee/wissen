import { readFileSync } from 'fs'
import { join } from 'path'
import { SCHEMA_SQL } from './schema-snapshot'

// lib/schema-snapshot.ts is generated from lib/schema.sql so the startup
// drift check can read the schema without `fs` (see
// scripts/generate-schema-snapshot.mjs). `npm run build` regenerates it via
// the prebuild script, but an edit to schema.sql committed without a build
// would leave a stale snapshot -- meaning the check would validate against
// yesterday's schema and miss exactly the drift it exists to catch.
describe('lib/schema-snapshot.ts', () => {
  it('matches lib/schema.sql (run `npm run schema:snapshot` if this fails)', () => {
    const onDisk = readFileSync(join(process.cwd(), 'lib', 'schema.sql'), 'utf-8')
    expect(SCHEMA_SQL).toBe(onDisk)
  })
})
