import { NextRequest, NextResponse } from 'next/server'
import { sendPartnerNotification, sendPartnerConfirmation } from '@/lib/email'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, organisation, message } = await req.json()
  if (!name || !email || !organisation)
    return NextResponse.json({ error: 'Name, email and organisation required' }, { status: 400 })

  if (typeof name !== 'string' || name.length > 100)
    return NextResponse.json({ error: 'Invalid name (max 100 chars)' }, { status: 400 })
  if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  if (typeof organisation !== 'string' || organisation.length > 200)
    return NextResponse.json({ error: 'Invalid organisation (max 200 chars)' }, { status: 400 })
  if (message && (typeof message !== 'string' || message.length > 5000))
    return NextResponse.json({ error: 'Invalid message (max 5000 chars)' }, { status: 400 })

  try {
    await sql`INSERT INTO submissions (type, name, email, data) VALUES ('partner', ${name}, ${email}, ${JSON.stringify({ organisation, message })})`
  } catch { /* non-fatal */ }

  try {
    await Promise.all([
      sendPartnerNotification({ name, email, organisation, message: message || '' }),
      sendPartnerConfirmation(email, name),
    ])
  } catch (err) {
    console.error('[partner email]', err)
  }

  return NextResponse.json({ success: true })
}
