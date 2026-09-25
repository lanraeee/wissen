import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { getSession } from '@/lib/auth'

const TrackSchema = z.object({
  pathname: z.string().min(1).max(500),
  referrer: z.string().max(1000).optional(),
  session_id: z.string().max(200).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
})

function parseDevice(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile'
  return 'desktop'
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Other'
}

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, TrackSchema)
    if (error) return NextResponse.json({ ok: false }, { status: 400 })
    const { pathname, referrer, session_id, utm_source, utm_medium, utm_campaign } = data

    if (pathname.startsWith('/admin')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ua = req.headers.get('user-agent') ?? ''
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') ?? '') || null
    // Attributes this view to the signed-in user, when there is one, so an
    // admin can see "pages visited" and location per-user, not just in
    // aggregate. Most visitors are anonymous -- that's fine, user_id is nullable.
    const session = await getSession()

    await sql`
      INSERT INTO page_views
        (pathname, referrer, country, city, device_type, browser, utm_source, utm_medium, utm_campaign, session_id, user_id)
      VALUES
        (${pathname}, ${referrer || null}, ${country}, ${city},
         ${parseDevice(ua)}, ${parseBrowser(ua)},
         ${utm_source || null}, ${utm_medium || null}, ${utm_campaign || null},
         ${session_id || null}, ${session?.id ?? null})
    `

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
