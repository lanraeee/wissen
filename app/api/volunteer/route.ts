import { NextRequest, NextResponse } from 'next/server'
import { sendVolunteerNotification, sendVolunteerConfirmation } from '@/lib/email'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, role, message } = await req.json()
  if (!name || !email || !role)
    return NextResponse.json({ error: 'Name, email and role are required' }, { status: 400 })

  try {
    await sql`INSERT INTO submissions (type, data) VALUES ('volunteer', ${JSON.stringify({ name, email, role, message })})`
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
