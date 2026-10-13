import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logActivity } from '@/lib/audit-log'
import { isMasterAdmin } from '@/lib/admin-guard'
import { VIEW_AS_COOKIE, VIEW_AS_META_COOKIE, verifyViewAs } from '@/lib/view-as-shared'

// Ends a view and returns the browser to the admin's own session. Exempt from
// the read-only rule in middleware, so it works while a view is active.
export async function POST() {
  const jar = await cookies()
  const claims = await verifyViewAs(jar.get(VIEW_AS_COOKIE)?.value)
  // The master admin's views are not logged, so their end is not logged either.
  if (claims && !isMasterAdmin(claims.viewer.email)) {
    await logActivity(claims.viewer, 'user.view_as.end', { targetType: 'user', targetId: claims.id })
  }
  const res = NextResponse.json({ success: true })
  res.cookies.delete(VIEW_AS_COOKIE)
  res.cookies.delete(VIEW_AS_META_COOKIE)
  return res
}
