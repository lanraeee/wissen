import { neon } from '@neondatabase/serverless'

// One booth per CAREER_INTERESTS category (skipping the "Other" catch-all,
// which isn't a real booth to staff) -- gives every registrant's explicit
// interest or assessment-derived category a matching recommendation.
const BOOTHS = [
  { id: 'tech', name: 'Technology & Software Careers', category: 'Technology', location: 'Hall A · Booth 1', description: 'Meet developers, product managers and data professionals. Live coding demos and career-path Q&A.' },
  { id: 'health', name: 'Healthcare & Medicine', category: 'Healthcare & Medicine', location: 'Hall A · Booth 2', description: 'Doctors, nurses and health workers on the path from secondary school to a career in medicine and healthcare.' },
  { id: 'business', name: 'Business & Finance', category: 'Business & Finance', location: 'Hall A · Booth 3', description: 'Banking, accounting, entrepreneurship and finance professionals share how they built their careers.' },
  { id: 'creative', name: 'Creative Arts & Media', category: 'Creative Arts & Media', location: 'Hall B · Booth 1', description: 'Design, film, music and content creators on turning creative talent into a sustainable career.' },
  { id: 'engineering', name: 'Engineering', category: 'Engineering', location: 'Hall B · Booth 2', description: 'Civil, mechanical and electrical engineers on what the work actually looks like day to day.' },
  { id: 'law-policy', name: 'Law, Policy & Social Impact', category: 'Law, Policy & Social Impact', location: 'Hall B · Booth 3', description: 'Lawyers, policy analysts and NGO leaders working on the issues that shape communities.' },
  { id: 'education', name: 'Education & Teaching', category: 'Education', location: 'Hall C · Booth 1', description: 'Teachers, school leaders and education-sector professionals on careers that shape the next generation.' },
  { id: 'skilled-trades', name: 'Skilled Trades', category: 'Skilled Trades', location: 'Hall C · Booth 2', description: 'Electricians, plumbers, mechanics and other trades professionals on hands-on careers with strong demand.' },
  { id: 'science', name: 'Science & Research', category: 'Science & Research', location: 'Hall C · Booth 3', description: 'Researchers and lab scientists on pursuing a career in scientific discovery.' },
]

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED
  if (!databaseUrl) { console.error('missing db url'); process.exit(1) }
  const sql = neon(databaseUrl)

  const events = await sql`SELECT id, slug, booths FROM fair_events WHERE slug LIKE 'career-clarity-fair-2026-11-%'`
  for (const e of events) {
    if (Array.isArray(e.booths) && e.booths.length > 0) {
      console.log(`- Skipped (already has booths): ${e.slug}`)
      continue
    }
    await sql`UPDATE fair_events SET booths = ${JSON.stringify(BOOTHS)}, updated_at = NOW() WHERE id = ${e.id}`
    console.log(`✓ Seeded ${BOOTHS.length} booths: ${e.slug}`)
  }
}

main().catch(err => { console.error(err.message); process.exit(1) })
