import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { log } from '@/lib/logger'

// Page size is enforced here, not just requested by the client: this endpoint
// is public and unauthenticated, so `limit` is clamped rather than trusted.
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 48

function clamp(raw: string | null, fallback: number, max: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(Math.floor(n), max)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')           // job | internship | scholarship | competition
    const local = searchParams.get('local') === '1' // Africa/Nigeria only
    const limit = clamp(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT)
    const offset = Math.max(0, Math.floor(Number(searchParams.get('offset')) || 0))

    // One parameterised query rather than the four near-identical branches
    // this replaces -- adding limit/offset to each of those would have meant
    // four more places for a paging bug to hide.
    //
    // `, id` is not decoration: date_posted has ties and nulls, and without a
    // unique tiebreaker Postgres is free to order tied rows differently
    // between requests, which makes OFFSET paging silently repeat and skip
    // cards as someone pages through.
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT * FROM opportunities
        WHERE (expires_at IS NULL OR expires_at > NOW())
          AND (${type}::text IS NULL OR type = ${type})
          AND (${local} = FALSE OR eligibility IN ('nigeria', 'africa'))
        ORDER BY date_posted DESC NULLS LAST, id
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int AS n FROM opportunities
        WHERE (expires_at IS NULL OR expires_at > NOW())
          AND (${type}::text IS NULL OR type = ${type})
          AND (${local} = FALSE OR eligibility IN ('nigeria', 'africa'))
      `,
    ])

    const total = countRows[0]?.n ?? 0
    return NextResponse.json({
      opportunities: rows,
      total,
      hasMore: offset + rows.length < total,
    })
  } catch (err) {
    log.error('opportunities GET', err)
    return NextResponse.json({ opportunities: [], total: 0, hasMore: false }, { status: 500 })
  }
}
