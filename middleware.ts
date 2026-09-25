import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifyToken } from '@/lib/auth-edge'
import { hit, clientIp, findRateLimit } from '@/lib/rate-limit'

const protectedRoutes = ['/community', '/jobs', '/internships', '/scholarships', '/competitions']
const publicCommunityRoutes = ['/community/landing']
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

  if (publicCommunityRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next()
  const isProtected = protectedRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProfileRoute = profileRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAdmin = adminRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected && !isProfileRoute && !isAdmin) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

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
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/community/:path*', '/jobs', '/internships', '/scholarships', '/competitions', '/profile', '/admin/:path*',
    '/api/auth/:path*', '/api/contact', '/api/partner', '/api/volunteer', '/api/submissions',
    '/api/payments/:path*', '/api/forum/:path*', '/api/testimonials',
  ]
}
