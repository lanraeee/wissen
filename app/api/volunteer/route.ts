import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendVolunteerNotification, sendVolunteerConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zMessage } from '@/lib/validation'
import { log } from '@/lib/logger'
import { startRecurringPledge, MIN_MONTHLY_NGN } from '@/lib/recurring-giving'

const VolunteerSchema = z.object({
  name: zName,
  email: zEmail,
  role: z.string().trim().min(1).max(100),
  message: zMessage,
  // Every volunteer commits to a monthly gift alongside their application —
  // see lib/recurring-giving.ts for why this is a soft gate (the
  // application always submits; it's the pledge that stays 'pending' until
  // completed).
  givingAmount: z.number().min(MIN_MONTHLY_NGN),
  givingMethod: z.enum(['stripe', 'bank_transfer']),
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, VolunteerSchema)
  if (error) return error
  const { name, email, role, message, givingAmount, givingMethod } = data

  let applicationId: string | null = null
  try {
    const [row] = await sql`
      INSERT INTO volunteer_applications (name, email, role, message)
      VALUES (${name}, ${email}, ${role}, ${message ?? null})
      RETURNING id
    `
    applicationId = row?.id as string
  } catch { /* non-fatal */ }

  let redirectUrl: string | null = null
  if (applicationId) {
    try {
      const pledge = await startRecurringPledge({
        sourceType: 'volunteer', sourceId: applicationId, name, email, amount: givingAmount, method: givingMethod,
      })
      redirectUrl = pledge.redirectUrl
    } catch (err) {
      log.error('volunteer recurring pledge', err)
    }
  }

  try {
    await Promise.all([
      sendVolunteerNotification({ name, email, role, message: message || '' }),
      sendVolunteerConfirmation(email, name, role),
    ])
  } catch (err) {
    log.error('volunteer email', err)
  }

  return NextResponse.json({ success: true, redirectUrl })
}
