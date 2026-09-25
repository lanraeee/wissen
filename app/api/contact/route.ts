import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactNotification, sendContactConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zShortText, zLongText } from '@/lib/validation'

const ContactSchema = z.object({
  name: zName,
  email: zEmail,
  subject: zShortText,
  message: zLongText,
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ContactSchema)
  if (error) return error
  const { name, email, subject, message } = data

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
