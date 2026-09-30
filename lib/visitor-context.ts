import type { NextRequest } from 'next/server'

export type VisitorContext = {
  deviceType: string
  browser: string
  os: string
  userAgent: string | null
  geoCountry: string | null
  geoRegion: string | null
  geoCity: string | null
  entryPage: string | null
  referrer: string | null
}

function parseDevice(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile'
  return 'desktop'
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Other'
}

function parseOs(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Other'
}

// Everything here is already in the request -- no extra round trip, no
// fingerprinting, nothing the visitor's browser was not already sending.
//
// The geo fields are Vercel's edge headers, which resolve an IP to the ISP's
// egress point. That is honest at country level, roughly right at city level,
// and meaningless below it. Street-level location is NOT derivable from an IP;
// the only source for it is the browser Geolocation API behind an explicit
// permission prompt, which is why it lives on a separate consented path
// (app/api/support/location) and never here.
export function visitorContextFrom(req: NextRequest, body: { page?: string | null; referrer?: string | null }): VisitorContext {
  const ua = req.headers.get('user-agent') ?? ''
  const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') ?? '') || null

  return {
    deviceType: parseDevice(ua),
    browser: parseBrowser(ua),
    os: parseOs(ua),
    // Truncated: a user-agent is diagnostic, and an unbounded header should
    // not become an unbounded column.
    userAgent: ua ? ua.slice(0, 400) : null,
    geoCountry: req.headers.get('x-vercel-ip-country') ?? null,
    geoRegion: req.headers.get('x-vercel-ip-country-region') ?? null,
    geoCity: city,
    entryPage: body.page?.slice(0, 500) ?? null,
    referrer: body.referrer?.slice(0, 1000) ?? null,
  }
}
