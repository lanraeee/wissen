import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPartnerNotification, sendPartnerConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zShortText, zMessage } from '@/lib/validation'

const PartnerSchema = z.object({
  name: zName,
  email: zEmail,
  organisation: zShortText,
  message: zMessage,
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, PartnerSchema)
  if (error) return error
  const { name, email, organisation, message } = data

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
