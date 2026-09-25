import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { parseBody } from '@/lib/validation'

const HighlightSchema = z.object({ label: z.string().max(200), value: z.string().max(200) })
const FundedSchema = z.object({ item: z.string().max(200), amount: z.string().max(100) })
const FaqSchema = z.object({ q: z.string().max(500), a: z.string().max(2000) })

const ProjectCreateSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().max(300).nullable().optional(),
  status: z.enum(['draft', 'published', 'closed']).optional(),
  event_name: z.string().max(200).nullable().optional(),
  event_date: z.string().max(30).nullable().optional(),
  event_location: z.string().max(300).nullable().optional(),
  event_time: z.string().max(100).nullable().optional(),
  campaign_start: z.string().max(30).nullable().optional(),
  campaign_end: z.string().max(30).nullable().optional(),
  goal_ngn: z.number().int().nonnegative().optional(),
  raised_ngn: z.number().int().nonnegative().optional(),
  donor_count: z.number().int().nonnegative().optional(),
  hero_desc: z.string().max(5000).nullable().optional(),
  partnership_name: z.string().max(300).nullable().optional(),
  partnership_desc: z.string().max(5000).nullable().optional(),
  highlights: z.array(HighlightSchema).max(50).optional(),
  what_funded: z.array(FundedSchema).max(50).optional(),
  impact_points: z.array(z.string().max(500)).max(50).optional(),
  faq: z.array(FaqSchema).max(50).optional(),
})

const ProjectUpdateSchema = ProjectCreateSchema.partial().extend({
  id: z.union([z.string(), z.number()]),
})

const IdSchema = z.object({ id: z.union([z.string(), z.number()]) })

// This used to check session.isAdmin, a claim signToken never issues, so every
// caller was rejected. Use the same guard the rest of /api/admin/* uses.
async function requireAdmin() {
  return (await adminGuard()) !== null
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
  const { data: body, error } = await parseBody(req, ProjectCreateSchema)
  if (error) return error
  const {
    slug, title, subtitle = null, status = 'draft',
    event_name = null, event_date = null, event_location = null, event_time = null,
    campaign_start = null, campaign_end = null,
    goal_ngn = 0, raised_ngn = 0, donor_count = 0,
    hero_desc = null, partnership_name = null, partnership_desc = null,
    highlights = [], what_funded = [], impact_points = [], faq = [],
  } = body

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
  const { data: body, error } = await parseBody(req, ProjectUpdateSchema)
  if (error) return error
  const { id, ...fields } = body as Record<string, unknown>

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
  const { data, error } = await parseBody(req, IdSchema)
  if (error) return error
  const { id } = data
  await sql`DELETE FROM donation_projects WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
