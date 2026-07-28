import { NextRequest, NextResponse } from 'next/server'
import { sendContactNotification, sendContactConfirmation } from '@/lib/email'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()
  if (!name || !email || !subject || !message)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })

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
