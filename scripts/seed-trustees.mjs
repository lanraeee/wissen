import { neon } from '@neondatabase/serverless'

const url = process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) {
  console.error('Error: WISSENDB_DATABASE_URL env var not found.')
  process.exit(1)
}
const sql = neon(url)

const trustees = [
  ['Benz Olagbaye', 'Founder & Executive Director', 'ex_officio', '2030-10-03', 'Founding trustee, ex officio by virtue of Executive Director role'],
  ['Gbemisola Abatan', 'Programmes & Partnerships Director', 'appointed', '2029-10-03', 'Appointed trustee'],
]

for (const [name, title, type, end, notes] of trustees) {
  const existing = await sql`SELECT 1 FROM trustee_register WHERE full_name = ${name}`
  if (existing.length) { console.log(`- ${name} already present`); continue }
  await sql`
    INSERT INTO trustee_register (full_name, position_title, appointment_type, appointment_date, term_end_date, status, notes)
    VALUES (${name}, ${title}, ${type}, '2026-10-03', ${end}, 'active', ${notes})
  `
  console.log(`✓ Added ${name}`)
}
