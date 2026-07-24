import { NextRequest, NextResponse } from 'next/server'
import { sendPartnerNotification } from '@/lib/email'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, organisation, message } = await req.json()
  if (!name || !email || !organisation)
    return NextResponse.json({ error: 'Name, email and organisation required' }, { status: 400 })

  try {
    await sql`INSERT INTO submissions (type, data) VALUES ('partner', ${JSON.stringify({ name, email, organisation, message })})`
  } catch { /* non-fatal */ }

  try {
    await sendPartnerNotification({ name, email, organisation, message: message || '' })
  } catch (err) {
    console.error('[partner email]', err)
  }

  return NextResponse.json({ success: true })
}
