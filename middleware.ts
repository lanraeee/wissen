import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth-edge'

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

  // Only check cookie presence here — JWT verification happens in server layouts
  // (Edge middleware cannot reliably access process.env in all Vercel configurations)
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/community/:path*', '/jobs', '/internships', '/scholarships', '/competitions', '/profile', '/admin/:path*']
}
