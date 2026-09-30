import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifyToken } from '@/lib/auth-edge'
import { hit, clientIp, findRateLimit } from '@/lib/rate-limit'
import { RETURN_PARAM } from '@/lib/return-url'

// The Community Hub itself is PUBLIC: browsing opportunities is the front
// door, and gating it hid every listing from search engines while the sitemap
// still advertised the page. Everything you can *do* from there is gated at
// the API instead -- posting a thread, replying, and submitting a story all
// return 401 without a session (app/api/forum/*, app/api/testimonials) -- and
// the discussion board below is gated here because it is a participation
// surface, not a browse one.
//
// /jobs, /internships, /scholarships and /competitions are 301s to /community
// (next.config.mjs) and must never appear here: middleware runs BEFORE config
// redirects, so gating them would send a visitor to /login instead of letting
// the redirect resolve, making a moved URL look broken.
const protectedRoutes = ['/community/threads']

// Partner scholarship application forms (/partners/<partner>/apply) are
// members-only: applying should be tied to a real Wissen-Haus account, and
// it gives applicants somewhere to come back to. The partnership's own info
// page (/partners/<partner>) stays public so anyone can read about it and
// decide to sign up -- so this deliberately matches the /apply leaf only,
// not the whole /partners tree.
const PARTNER_APPLY_ROUTE = /^\/partners\/[^/]+\/apply(\/|$)/
const profileRoutes = ['/profile']
const adminRoutes = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limit mutating requests to abuse-prone API routes. GETs (reads) are
  // never limited here. See lib/rate-limit.ts for the per-route table and
  // the tradeoffs of the in-memory store used.
  if (pathname.startsWith('/api/') && req.method !== 'GET' && req.method !== 'HEAD') {
    const rule = findRateLimit(pathname)
    if (rule) {
      const key = `${rule.prefix}:${clientIp(req)}`
      const result = hit(key, rule.limit, rule.windowMs)
      if (!result.ok) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Remaining': String(result.remaining),
            },
          }
        )
      }
    }
  }

  // /community/landing needed an explicit exception back when the whole
  // /community tree was protected. Only /community/threads is now, so it
  // falls through on its own.
  const isProtected = protectedRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
    || PARTNER_APPLY_ROUTE.test(pathname)
  const isProfileRoute = profileRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAdmin = adminRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected && !isProfileRoute && !isAdmin) return NextResponse.next()

  // Carry where they were headed, so signing in returns them to it rather
  // than dumping everyone on /community -- which matters most on routes
  // reached mid-task, like a partner scholarship application form.
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set(RETURN_PARAM, pathname + req.nextUrl.search)

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.redirect(loginUrl)

  // Verify the signature here, not just the cookie's presence, so a forged or
  // expired token cannot reach a protected route at all. jose runs on the Edge
  // runtime, and JWT_SECRET is supplied to this bundle by next.config.mjs.
  // Role checks still happen in the server layouts and handlers that need them.
  try {
    await verifyToken(token)
  } catch {
    // The cookie is present but unusable (expired, tampered with, or signed
    // with a rotated secret). Clear it so the browser stops replaying a dead
    // token on every request.
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/community/threads/:path*', '/profile', '/admin/:path*',
    '/partners/:partner/apply',
    '/api/auth/:path*', '/api/contact', '/api/partner', '/api/volunteer', '/api/submissions',
    '/api/payments/:path*', '/api/forum/:path*', '/api/testimonials', '/api/career-fair/:path*',
    '/api/scholarships/:path*',
  ]
}
