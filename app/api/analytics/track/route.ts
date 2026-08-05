import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

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
    const body = await req.json()
    const { pathname, referrer, session_id, utm_source, utm_medium, utm_campaign } = body

    if (!pathname || typeof pathname !== 'string' || pathname.startsWith('/admin')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ua = req.headers.get('user-agent') ?? ''
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') ?? '') || null

    await sql`
      INSERT INTO page_views
        (pathname, referrer, country, city, device_type, browser, utm_source, utm_medium, utm_campaign, session_id)
      VALUES
        (${pathname}, ${referrer || null}, ${country}, ${city},
         ${parseDevice(ua)}, ${parseBrowser(ua)},
         ${utm_source || null}, ${utm_medium || null}, ${utm_campaign || null},
         ${session_id || null})
    `

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
