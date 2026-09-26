import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.WISSENDB_DATABASE_URL_UNPOOLED)
await sql`
  ALTER TABLE fair_registrations
  ADD COLUMN IF NOT EXISTS attending_as TEXT NOT NULL DEFAULT 'Student'
  CHECK (attending_as IN ('Student', 'Volunteer', 'Mentor'))
`
console.log('✓ attending_as column added')
