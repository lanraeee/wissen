import { neon } from '@neondatabase/serverless'

// Seeds the DataCamp entry into site_content.partner_scholarships so it shows
// up as a real, editable row in admin Content -> Partner Scholarships rather
// than the editor reporting "nothing saved yet" while the public page quietly
// renders the built-in fallback from lib/partner-scholarships.ts.
//
// Values are deliberately identical to DEFAULT_PARTNER_SCHOLARSHIPS, so the
// public page looks exactly the same before and after -- this only moves the
// content from code into the CMS where it can be edited. The code fallback
// stays as the safety net if the row is ever deleted.
//
// Idempotent: skips if a non-empty list has already been saved, so running it
// again can never clobber an admin's edits.
const PARTNER_SCHOLARSHIPS = [
  {
    name: 'DataCamp Donates',
    logo: '/img/partners/datacamp-logo.jpg',
    description: 'Free access to 500+ premium data science, AI and analytics courses for motivated students facing genuine financial or access barriers.',
    infoHref: '/partners/datacamp',
    applyHref: '/partners/datacamp/apply',
    applyLabel: 'Apply for a Scholarship',
  },
]

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED ?? process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Error: WISSENDB_DATABASE_URL env var not found.')
    console.error('Run: vercel env pull .env.local --yes  then try again.')
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  const [existing] = await sql`SELECT value FROM site_content WHERE key = 'partner_scholarships'`
  if (Array.isArray(existing?.value) && existing.value.length > 0) {
    console.log(`- Skipped: ${existing.value.length} partner scholarship(s) already saved (${existing.value.map(v => v.name).join(', ')})`)
    return
  }

  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES ('partner_scholarships', ${JSON.stringify(PARTNER_SCHOLARSHIPS)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(PARTNER_SCHOLARSHIPS)}, updated_at = NOW()
  `
  console.log(`✓ Seeded ${PARTNER_SCHOLARSHIPS.length} partner scholarship: ${PARTNER_SCHOLARSHIPS.map(p => p.name).join(', ')}`)
  console.log('  Edit it at /admin/content?tab=partner-scholarships')
}

main()
