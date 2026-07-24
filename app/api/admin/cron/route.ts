import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'

export async function POST() {
  const session = await getSession()
  if (!session || session.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cronSecret = process.env.CRON_SECRET
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/cron/opportunities`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
