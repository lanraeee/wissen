import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { RETURN_PARAM } from '@/lib/return-url'

// The discussion board is a participation surface, so it stays members-only
// even though the Community Hub above it is now public. This gate used to sit
// at app/community/layout.tsx and covered the whole tree -- including
// /community/landing, which middleware listed as public and which was
// therefore never actually reachable signed out.
//
// Middleware already redirects here with a return path; this is the belt to
// its braces, for any request that reaches the segment without passing it.
export default async function ThreadsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect(`/login?mode=login&${RETURN_PARAM}=${encodeURIComponent('/community/threads')}`)
  return <>{children}</>
}
