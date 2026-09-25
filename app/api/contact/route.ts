import { NextRequest, NextResponse } from 'next/server'
import { sendContactNotification, sendContactConfirmation } from '@/lib/email'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()
  if (!name || !email || !subject || !message)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  if (typeof name !== 'string' || name.length > 100)
    return NextResponse.json({ error: 'Invalid name (max 100 chars)' }, { status: 400 })
  if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  if (typeof subject !== 'string' || subject.length > 200)
    return NextResponse.json({ error: 'Invalid subject (max 200 chars)' }, { status: 400 })
  if (typeof message !== 'string' || message.length > 5000)
    return NextResponse.json({ error: 'Invalid message (max 5000 chars)' }, { status: 400 })

  try {
    await sql`INSERT INTO submissions (type, name, email, data) VALUES ('contact', ${name}, ${email}, ${JSON.stringify({ subject, message })})`
  } catch { /* non-fatal if DB unavailable */ }

  try {
    await Promise.all([
      sendContactNotification({ name, email, subject, message }),
      sendContactConfirmation(email, name),
    ])
  } catch (err) {
    console.error('[contact email]', err)
  }

  return NextResponse.json({ success: true })
}
