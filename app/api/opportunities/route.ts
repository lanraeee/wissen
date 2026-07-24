import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'jobs','internships','scholarships','competitions' or null for all
    const local = searchParams.get('local') === '1' // Africa/Nigeria only

    let rows
    if (type && local) {
      rows = await sql`
        SELECT * FROM opportunities
        WHERE type = ${type} AND eligibility IN ('nigeria', 'africa')
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY date_posted DESC NULLS LAST
        LIMIT 100
      `
    } else if (type) {
      rows = await sql`
        SELECT * FROM opportunities
        WHERE type = ${type}
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY date_posted DESC NULLS LAST
        LIMIT 100
      `
    } else if (local) {
      rows = await sql`
        SELECT * FROM opportunities
        WHERE eligibility IN ('nigeria', 'africa')
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY date_posted DESC NULLS LAST
        LIMIT 100
      `
    } else {
      rows = await sql`
        SELECT * FROM opportunities
        WHERE (expires_at IS NULL OR expires_at > NOW())
        ORDER BY date_posted DESC NULLS LAST
        LIMIT 200
      `
    }

    return NextResponse.json({ opportunities: rows })
  } catch (err) {
    console.error('[opportunities GET]', err)
    return NextResponse.json({ opportunities: [] }, { status: 500 })
  }
}
