import { neon } from '@neondatabase/serverless'

const FAIR_SLIDE = {
  eyebrow: 'Nov 15–21, 2026 · Multiple Schools',
  headlineLine1: 'The Career Clarity Fair',
  headlineLine2: 'Is Coming to You.',
  lead: 'A week of career exploration fairs across schools in Ibadan — hands-on booths, real professionals, and a clear next step for every student who walks through the door.',
  ctaText: 'Register to Attend',
  ctaHref: '/career-clarity-fair/register',
  image: '/img/prog-bootcamp.jpg',
}

const DEFAULT_HERO = {
  eyebrow: 'Ibadan, Nigeria · Est. 2025',
  headlineLine1: 'Your Roadmap to',
  headlineLine2: 'Opportunity Starts Here.',
  lead: "Confused about what's next? Don't know where to start? We've built resources that help you discover careers that match your interests, understand what it takes to succeed, and connect with people doing the work you're curious about.",
  ctaText: 'Take the Career Assessment',
  ctaHref: '/career-pathways',
  image: '',
}

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED
  if (!databaseUrl) { console.error('missing db url'); process.exit(1) }
  const sql = neon(databaseUrl)

  const [slidesRow] = await sql`SELECT value FROM site_content WHERE key = 'homepage_hero_slides'`
  const [legacyRow] = await sql`SELECT value FROM site_content WHERE key = 'homepage_hero'`

  let slides = Array.isArray(slidesRow?.value) && slidesRow.value.length > 0
    ? slidesRow.value
    : [legacyRow?.value ? { ...DEFAULT_HERO, ...legacyRow.value } : DEFAULT_HERO]

  if (slides.some(s => s.headlineLine1 === FAIR_SLIDE.headlineLine1 && s.headlineLine2 === FAIR_SLIDE.headlineLine2)) {
    console.log('Fair announcement slide already present -- no change made.')
    return
  }

  slides = [...slides, FAIR_SLIDE]

  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES ('homepage_hero_slides', ${JSON.stringify(slides)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(slides)}, updated_at = NOW()
  `
  console.log(`✓ homepage_hero_slides now has ${slides.length} slide(s)`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
