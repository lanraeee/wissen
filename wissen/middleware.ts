import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth-edge'

const protectedRoutes = ['/community', '/jobs', '/internships', '/scholarships', '/competitions']
// Profile page requires auth; courses are publicly browsable (progress tracking is optional)
const profileRoutes = ['/profile']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = protectedRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProfileRoute = profileRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected && !isProfileRoute) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const target = pathname.startsWith('/community') ? '/community/landing' : '/login'
    return NextResponse.redirect(new URL(target, req.url))
  }

  try {
    await verifyToken(token)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }
}

export const config = {
  matcher: ['/community/:path*', '/jobs', '/internships', '/scholarships', '/competitions', '/profile']
}
