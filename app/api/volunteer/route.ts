import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendVolunteerNotification, sendVolunteerConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zMessage } from '@/lib/validation'

const VolunteerSchema = z.object({
  name: zName,
  email: zEmail,
  role: z.string().trim().min(1).max(100),
  message: zMessage,
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, VolunteerSchema)
  if (error) return error
  const { name, email, role, message } = data

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
