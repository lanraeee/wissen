import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifyToken } from '@/lib/auth-edge'

const protectedRoutes = ['/community', '/jobs', '/internships', '/scholarships', '/competitions']
const publicCommunityRoutes = ['/community/landing']
const profileRoutes = ['/profile']
const adminRoutes = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
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
  matcher: ['/community/:path*', '/jobs', '/internships', '/scholarships', '/competitions', '/profile', '/admin/:path*']
}
