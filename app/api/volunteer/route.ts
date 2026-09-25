import { NextRequest, NextResponse } from 'next/server'
import { sendVolunteerNotification, sendVolunteerConfirmation } from '@/lib/email'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, role, message } = await req.json()
  if (!name || !email || !role)
    return NextResponse.json({ error: 'Name, email and role are required' }, { status: 400 })

  if (typeof name !== 'string' || name.length > 100)
    return NextResponse.json({ error: 'Invalid name (max 100 chars)' }, { status: 400 })
  if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  if (typeof role !== 'string' || role.length > 100)
    return NextResponse.json({ error: 'Invalid role (max 100 chars)' }, { status: 400 })
  if (message && (typeof message !== 'string' || message.length > 5000))
    return NextResponse.json({ error: 'Invalid message (max 5000 chars)' }, { status: 400 })

  try {
    await sql`INSERT INTO submissions (type, name, email, data) VALUES ('volunteer', ${name}, ${email}, ${JSON.stringify({ role, message })})`
  } catch { /* non-fatal */ }

  try {
    await Promise.all([
      sendVolunteerNotification({ name, email, role, message: message || '' }),
      sendVolunteerConfirmation(email, name, role),
    ])
  } catch (err) {
    console.error('[volunteer email]', err)
  }

  return NextResponse.json({ success: true })
}
