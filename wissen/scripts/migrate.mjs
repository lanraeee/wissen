import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED ?? process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Error: WISSENDB_DATABASE_URL env var not found.')
    console.error('Run: vercel env pull .env.local --yes  then try again.')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const schemaPath = join(__dirname, '../lib/schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')

  console.log('Running Wissen-Haus database migration...')

  // Split into individual statements and run each via neon's query method
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      // neon() can be called as a plain function with a string for dynamic SQL
      await sql(statement)
      const match = statement.match(/CREATE (?:TABLE|EXTENSION) (?:IF NOT EXISTS )?"?(\w+)"?/i)
      if (match) console.log(`✓ ${match[0].replace('IF NOT EXISTS ', '')}`)
    } catch (err) {
      console.error('Error running statement:', statement.slice(0, 80) + '...')
      console.error(err.message)
      process.exit(1)
    }
  }

  console.log('\n✓ Migration complete!')
}

main()
