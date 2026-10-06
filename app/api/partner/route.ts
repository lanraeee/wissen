import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPartnerNotification, sendPartnerConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zShortText, zMessage } from '@/lib/validation'
import { log } from '@/lib/logger'
import { startRecurringPledge, MIN_MONTHLY_NGN } from '@/lib/recurring-giving'

const PartnerSchema = z.object({
  name: zName,
  email: zEmail,
  organisation: zShortText,
  partnershipType: z.string().trim().max(50).optional(),
  message: zMessage,
  // Every partner commits to a monthly gift alongside their enquiry — see
  // lib/recurring-giving.ts for why this is a soft gate (the enquiry always
  // submits; it's the pledge that stays 'pending' until completed).
  givingAmount: z.number().min(MIN_MONTHLY_NGN),
  givingMethod: z.enum(['stripe', 'bank_transfer']),
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, PartnerSchema)
  if (error) return error
  const { name, email, organisation, partnershipType, message, givingAmount, givingMethod } = data

  let inquiryId: string | null = null
  try {
    const [row] = await sql`
      INSERT INTO partner_inquiries (name, email, organisation, partnership_type, message)
      VALUES (${name}, ${email}, ${organisation}, ${partnershipType ?? null}, ${message ?? null})
      RETURNING id
    `
    inquiryId = row?.id as string
  } catch { /* non-fatal */ }

  let redirectUrl: string | null = null
  if (inquiryId) {
    try {
      const pledge = await startRecurringPledge({
        sourceType: 'partner', sourceId: inquiryId, name, email, amount: givingAmount, method: givingMethod,
      })
      redirectUrl = pledge.redirectUrl
    } catch (err) {
      log.error('partner recurring pledge', err)
    }
  }

  try {
    await Promise.all([
      sendPartnerNotification({ name, email, organisation, message: message || '' }),
      sendPartnerConfirmation(email, name),
    ])
  } catch (err) {
    log.error('partner email', err)
  }

  return NextResponse.json({ success: true, redirectUrl })
}
