import { neon } from '@neondatabase/serverless'

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED ?? process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Error: WISSENDB_DATABASE_URL env var not found.')
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  const days = [
    ['2026-11-15', 'Sunday'],
    ['2026-11-16', 'Monday'],
    ['2026-11-17', 'Tuesday'],
    ['2026-11-18', 'Wednesday'],
    ['2026-11-19', 'Thursday'],
    ['2026-11-20', 'Friday'],
    ['2026-11-21', 'Saturday'],
  ]

  console.log('Seeding Career Clarity Fair events for Nov 15-21, 2026...')

  for (const [date, dow] of days) {
    const slug = `career-clarity-fair-${date}`
    const title = `Career Clarity Fair — ${dow}, ${new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`
    const [row] = await sql`
      INSERT INTO fair_events (slug, title, school, location, event_date, event_time, status, description, booths)
      VALUES (${slug}, ${title}, NULL, NULL, ${date}, NULL, 'published', NULL, '[]')
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug
    `
    console.log(row ? `✓ Created: ${row.slug} (id ${row.id})` : `– Skipped (already exists): ${slug}`)
  }

  console.log('\nDone. Edit each event in /admin/career-fair to set its school, location, time, and booths.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
