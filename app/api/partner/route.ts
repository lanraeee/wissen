import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPartnerNotification, sendPartnerConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zShortText, zMessage } from '@/lib/validation'
import { log } from '@/lib/logger'

const PartnerSchema = z.object({
  name: zName,
  email: zEmail,
  organisation: zShortText,
  partnershipType: z.string().trim().max(50).optional(),
  message: zMessage,
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, PartnerSchema)
  if (error) return error
  const { name, email, organisation, partnershipType, message } = data

  try {
    await sql`
      INSERT INTO partner_inquiries (name, email, organisation, partnership_type, message)
      VALUES (${name}, ${email}, ${organisation}, ${partnershipType ?? null}, ${message ?? null})
    `
  } catch { /* non-fatal */ }

  try {
    await Promise.all([
      sendPartnerNotification({ name, email, organisation, message: message || '' }),
      sendPartnerConfirmation(email, name),
    ])
  } catch (err) {
    log.error('partner email', err)
  }

  return NextResponse.json({ success: true })
}
