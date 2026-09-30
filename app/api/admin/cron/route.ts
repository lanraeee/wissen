import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'

export async function POST() {
  // directorGuard() admits both director addresses. Comparing against
  // FOUNDER_EMAIL alone, as this route used to, locked the master admin
  // (wissenhaus@outlook.com) out of a control every other director check
  // grants them.
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cronSecret = process.env.CRON_SECRET
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/cron/opportunities`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    const data = await res.json()
    logActivity(session, 'cron.trigger', { targetType: 'opportunities' })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
