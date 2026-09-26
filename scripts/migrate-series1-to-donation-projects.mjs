import { neon } from '@neondatabase/serverless'

const PROJECT = {
  slug: 'series-1',
  title: 'Career Clarity Fair — Donation Drive Series 1',
  subtitle: '500–1,000 students · Ibadan · 5 December 2026',
  status: 'published',
  event_name: 'Career Clarity Fair',
  event_date: '2026-12-05',
  event_location: 'Ibadan, Oyo State',
  event_time: '8:00am – 5:00pm',
  campaign_start: '2026-09-07',
  campaign_end: '2026-12-05',
  goal_ngn: 50000000,
  raised_ngn: 0,
  donor_count: 0,
  hero_desc: 'The Career Clarity Fair is happening. One day. One campus in Ibadan. Fifteen career sectors, in three age-appropriate tracks (JSS1–JSS2, JSS3, SS1–SS3): 70% hands-on participation, 30% talks. Free entry for every secondary student who walks through the door, hosted on a partner campus in Ibadan. This campaign funds the student materials, facilitators, event environment and impact measurement that turn the Fair from an idea into evidence.',
  partnership_name: 'Career Clarity Fair × Animation Studio Partner',
  partnership_desc: 'Our partner (name to be confirmed) brings youth-focused animated storytelling to the Fair — content chosen to build cultural pride and self-belief. The activation includes an animated content screening with guided discussion, a Confidence Challenge where students publicly name one thing they believe they can do, and creative responses captured and celebrated on the day.',
  highlights: [
    { label: 'Students expected', value: '500–1,000' },
    { label: 'Partner schools', value: '3+' },
    { label: 'Career sectors', value: '15+' },
    { label: 'Event day', value: '5 Dec 2026' },
  ],
  what_funded: [
    { item: 'Student resource packs (Passport, Workbook, Action Card, Badge)', amount: '₦15,000,000' },
    { item: 'Facilitator & volunteer coordination, transport', amount: '₦9,500,000' },
    { item: 'Event environment — signage, banners, stage backdrop', amount: '₦7,500,000' },
    { item: 'Measurement tools — pre/during/after surveys, quiz printing', amount: '₦6,000,000' },
    { item: 'Photography & videography — student voice capture', amount: '₦8,000,000' },
    { item: 'Logistics & contingency', amount: '₦4,000,000' },
  ],
  impact_points: [
    'Reach — students, schools, age groups reached',
    'Engagement — screening, quiz and challenge participation rates',
    'Student Voice — selected quotes and reactions, with consent',
    'Learning — pre and post responses to named outcomes',
    'Cultural Connection — how Ibadan youth respond to Yoruba-language animation',
    'Next Step — evidence that opens the Ibadan school activation pathway',
  ],
  faq: [
    { q: 'What exactly is the Career Clarity Fair?', a: 'A one-day career discovery marketplace for secondary school students in Ibadan — hands-on exploration across 15+ career sectors, in three age-appropriate tracks (JSS1–JSS2, JSS3, SS1–SS3). Design principle: 70% hands-on participation, 30% talks. Scheduled for Saturday 5 December 2026.' },
    { q: 'Who is the animation studio partner and what role do they play?', a: 'Our animation studio partner (name withheld until the partnership is fully confirmed) is a Nigerian animation studio. At the Fair, their content becomes the centrepiece of a designed activation — a screening with guided discussion, built around a confidence-building challenge where students publicly name one thing they believe they can do.' },
    { q: 'What does my donation specifically fund?', a: 'This Donation Drive covers the community delivery costs: student resource packs, facilitator coordination, event environment (signage, banners, backdrop), measurement tools (pre/during/after surveys), and photography and video documentation. The core content partnership is funded separately.' },
    { q: 'Will I receive an update on impact?', a: 'Yes. After the Fair (December 2026 – January 2027), we publish the Career Clarity Fair Impact Snapshot — measuring reach, student engagement, learning outcomes, and student voice. All donors will receive this report. Donors of ₦50,000 or more receive a personalised acknowledgement.' },
  ],
  stages: [
    { n: '1', title: 'Reach', desc: 'Animated content screened in front of 500–1,000 Ibadan students — JSS1 through SS3 — in a single day, in one room.' },
    { n: '2', title: 'Engage', desc: 'Watch, quiz, discuss, create. Six touchpoints with the same content — not passive viewing, but participation that leaves something behind.' },
    { n: '3', title: 'Learn', desc: 'Every activity is tied to named learning outcomes agreed with our partners — cultural identity, self-belief, aspiration, resilience.' },
    { n: '4', title: 'Measure', desc: 'Before, during, and after. Student voice captured as evidence — the same children measured at each stage with a consistent instrument.' },
    { n: '5', title: 'Extend', desc: 'The Fair produces an Impact Snapshot: a co-branded report on what the content did — evidence that opens the door to Ibadan school activations and further funding.' },
  ],
  accountability: [
    { title: 'All to the Fair', desc: 'Every naira and dollar raised in this Series 1 drive goes directly to the 5 December Career Clarity Fair delivery costs.' },
    { title: 'Impact Snapshot', desc: 'After the Fair, all donors receive the Career Clarity Fair Impact Snapshot — real numbers, real student voices.' },
    { title: 'Secure Payments', desc: 'Processed by Stripe — PCI-compliant and encrypted, for Naira, Dollar and Pound gifts alike. Payment details never stored by Wissen-Haus.' },
  ],
  donation_equivalents: [
    { amount: '₦15,000', equiv: "A student's workbook, passport & action card" },
    { amount: '₦60,000', equiv: 'All materials for four students for the full day' },
    { amount: '₦50,000', equiv: "Sponsors one facilitator's transport and day rate" },
  ],
}

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED
  if (!databaseUrl) { console.error('missing db url'); process.exit(1) }
  const sql = neon(databaseUrl)

  await sql`
    CREATE TABLE IF NOT EXISTS donation_projects (
      id          SERIAL PRIMARY KEY,
      slug        TEXT UNIQUE NOT NULL,
      title       TEXT NOT NULL,
      subtitle    TEXT,
      status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
      event_name      TEXT,
      event_date      DATE,
      event_location  TEXT,
      event_time      TEXT,
      campaign_start  DATE,
      campaign_end    DATE,
      goal_ngn     INTEGER NOT NULL DEFAULT 0,
      raised_ngn   INTEGER NOT NULL DEFAULT 0,
      donor_count  INTEGER NOT NULL DEFAULT 0,
      hero_desc        TEXT,
      partnership_name TEXT,
      partnership_desc TEXT,
      highlights    JSONB NOT NULL DEFAULT '[]',
      what_funded   JSONB NOT NULL DEFAULT '[]',
      impact_points JSONB NOT NULL DEFAULT '[]',
      faq           JSONB NOT NULL DEFAULT '[]',
      stages               JSONB NOT NULL DEFAULT '[]',
      accountability       JSONB NOT NULL DEFAULT '[]',
      donation_equivalents JSONB NOT NULL DEFAULT '[]',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE donation_projects ADD COLUMN IF NOT EXISTS stages JSONB NOT NULL DEFAULT '[]'`
  await sql`ALTER TABLE donation_projects ADD COLUMN IF NOT EXISTS accountability JSONB NOT NULL DEFAULT '[]'`
  await sql`ALTER TABLE donation_projects ADD COLUMN IF NOT EXISTS donation_equivalents JSONB NOT NULL DEFAULT '[]'`

  const existing = await sql`SELECT id FROM donation_projects WHERE slug = ${PROJECT.slug}`
  if (existing.length > 0) {
    console.log(`Project with slug "${PROJECT.slug}" already exists (id ${existing[0].id}) -- no change made.`)
    return
  }

  const [row] = await sql`
    INSERT INTO donation_projects
      (slug, title, subtitle, status, event_name, event_date, event_location, event_time,
       campaign_start, campaign_end, goal_ngn, raised_ngn, donor_count,
       hero_desc, partnership_name, partnership_desc,
       highlights, what_funded, impact_points, faq, stages, accountability, donation_equivalents)
    VALUES
      (${PROJECT.slug}, ${PROJECT.title}, ${PROJECT.subtitle}, ${PROJECT.status},
       ${PROJECT.event_name}, ${PROJECT.event_date}, ${PROJECT.event_location}, ${PROJECT.event_time},
       ${PROJECT.campaign_start}, ${PROJECT.campaign_end}, ${PROJECT.goal_ngn}, ${PROJECT.raised_ngn}, ${PROJECT.donor_count},
       ${PROJECT.hero_desc}, ${PROJECT.partnership_name}, ${PROJECT.partnership_desc},
       ${JSON.stringify(PROJECT.highlights)}, ${JSON.stringify(PROJECT.what_funded)},
       ${JSON.stringify(PROJECT.impact_points)}, ${JSON.stringify(PROJECT.faq)},
       ${JSON.stringify(PROJECT.stages)}, ${JSON.stringify(PROJECT.accountability)}, ${JSON.stringify(PROJECT.donation_equivalents)})
    RETURNING id, slug
  `
  console.log(`✓ Created donation_projects row: id ${row.id}, slug "${row.slug}"`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
