import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.isAdmin) return false
  return true
}

async function ensureTable() {
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

      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTable()
  const rows = await sql`SELECT * FROM donation_projects ORDER BY created_at DESC`
  return NextResponse.json({ projects: rows })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureTable()
  const body = await req.json()
  const {
    slug, title, subtitle = null, status = 'draft',
    event_name = null, event_date = null, event_location = null, event_time = null,
    campaign_start = null, campaign_end = null,
    goal_ngn = 0, raised_ngn = 0, donor_count = 0,
    hero_desc = null, partnership_name = null, partnership_desc = null,
    highlights = [], what_funded = [], impact_points = [], faq = [],
  } = body

  if (!slug || !title) return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })

  const [row] = await sql`
    INSERT INTO donation_projects
      (slug, title, subtitle, status, event_name, event_date, event_location, event_time,
       campaign_start, campaign_end, goal_ngn, raised_ngn, donor_count,
       hero_desc, partnership_name, partnership_desc,
       highlights, what_funded, impact_points, faq)
    VALUES
      (${slug}, ${title}, ${subtitle}, ${status}, ${event_name}, ${event_date}, ${event_location}, ${event_time},
       ${campaign_start}, ${campaign_end}, ${goal_ngn}, ${raised_ngn}, ${donor_count},
       ${hero_desc}, ${partnership_name}, ${partnership_desc},
       ${JSON.stringify(highlights)}, ${JSON.stringify(what_funded)},
       ${JSON.stringify(impact_points)}, ${JSON.stringify(faq)})
    RETURNING *
  `
  return NextResponse.json({ project: row }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const jsonFields = ['highlights', 'what_funded', 'impact_points', 'faq']
  for (const f of jsonFields) {
    if (fields[f] !== undefined) fields[f] = JSON.stringify(fields[f])
  }

  const [row] = await sql`
    UPDATE donation_projects SET
      slug             = COALESCE(${fields.slug ?? null}, slug),
      title            = COALESCE(${fields.title ?? null}, title),
      subtitle         = ${fields.subtitle ?? null},
      status           = COALESCE(${fields.status ?? null}, status),
      event_name       = ${fields.event_name ?? null},
      event_date       = ${fields.event_date ?? null},
      event_location   = ${fields.event_location ?? null},
      event_time       = ${fields.event_time ?? null},
      campaign_start   = ${fields.campaign_start ?? null},
      campaign_end     = ${fields.campaign_end ?? null},
      goal_ngn         = COALESCE(${fields.goal_ngn ?? null}, goal_ngn),
      raised_ngn       = COALESCE(${fields.raised_ngn ?? null}, raised_ngn),
      donor_count      = COALESCE(${fields.donor_count ?? null}, donor_count),
      hero_desc        = ${fields.hero_desc ?? null},
      partnership_name = ${fields.partnership_name ?? null},
      partnership_desc = ${fields.partnership_desc ?? null},
      highlights       = COALESCE(${fields.highlights ?? null}::jsonb, highlights),
      what_funded      = COALESCE(${fields.what_funded ?? null}::jsonb, what_funded),
      impact_points    = COALESCE(${fields.impact_points ?? null}::jsonb, impact_points),
      faq              = COALESCE(${fields.faq ?? null}::jsonb, faq),
      updated_at       = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ project: row })
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await sql`DELETE FROM donation_projects WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
