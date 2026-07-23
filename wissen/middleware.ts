import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth-edge'

const protectedRoutes = ['/community', '/jobs', '/internships', '/scholarships', '/competitions']
const publicCommunityRoutes = ['/community/landing']
const profileRoutes = ['/profile']
const adminRoutes = ['/admin']
const ADMIN_EMAIL = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (publicCommunityRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next()
  const isProtected = protectedRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProfileRoute = profileRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAdmin = adminRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected && !isProfileRoute && !isAdmin) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const target = pathname.startsWith('/community') ? '/community/landing' : '/login'
    return NextResponse.redirect(new URL(target, req.url))
  }

  try {
    const payload = await verifyToken(token)
    if (isAdmin && payload.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }
}

export const config = {
  matcher: ['/community/:path*', '/jobs', '/internships', '/scholarships', '/competitions', '/profile', '/admin/:path*']
}
