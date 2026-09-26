import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { parseBody, zEmail, zName } from '@/lib/validation'
import { CAREER_INTERESTS, CLASS_GRADES, generateCheckinToken, recommendBooths, type Booth } from '@/lib/career-fair'
import { sendFairRegistrationConfirmation, sendFairRegistrationNotification } from '@/lib/email'
import { log } from '@/lib/logger'

const AssessmentSnapshotSchema = z.array(
  z.object({ key: z.string().max(20), score: z.number(), reasons: z.array(z.string().max(300)).max(10).optional() })
).max(12).optional()

const RegisterSchema = z.object({
  eventId: z.number().int(),
  name: zName,
  email: zEmail,
  phone: z.string().trim().max(30).optional(),
  school: z.string().trim().min(1).max(200),
  classGrade: z.enum(CLASS_GRADES).optional(),
  careerInterest: z.enum(CAREER_INTERESTS).optional(),
  newsletterOptIn: z.boolean().optional(),
  assessmentSnapshot: AssessmentSnapshotSchema,
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, RegisterSchema)
  if (error) return error
  const { eventId, name, email, phone, school, classGrade, careerInterest, newsletterOptIn, assessmentSnapshot } = data

  const [event] = await sql`
    SELECT id, slug, title, school, location, event_date, event_time, booths
    FROM fair_events WHERE id = ${eventId} AND status = 'published'
  `
  if (!event) return NextResponse.json({ error: 'This fair is not open for registration.' }, { status: 404 })

  const token = generateCheckinToken()

  let row
  try {
    ;[row] = await sql`
      INSERT INTO fair_registrations
        (event_id, name, email, phone, school, class_grade, career_interest, assessment_snapshot, newsletter_opt_in, checkin_token)
      VALUES
        (${eventId}, ${name}, ${email.toLowerCase()}, ${phone || null}, ${school}, ${classGrade || null},
         ${careerInterest || null}, ${assessmentSnapshot ? JSON.stringify(assessmentSnapshot) : null},
         ${newsletterOptIn ?? false}, ${token})
      RETURNING id
    `
  } catch (err) {
    log.error('career-fair register insert', err)
    return NextResponse.json({ error: 'Could not complete registration. Please try again.' }, { status: 502 })
  }

  const booths = recommendBooths(event.booths as Booth[], careerInterest ?? null, assessmentSnapshot ?? null)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const guideUrl = `${siteUrl}/career-clarity-trade-fair/checkin/${token}`

  Promise.all([
    sendFairRegistrationConfirmation({
      to: email, name, eventTitle: event.title as string,
      eventDate: event.event_date as string | null, eventTime: event.event_time as string | null,
      eventLocation: event.location as string | null, guideUrl, recommendedBooths: booths.map(b => b.name),
    }),
    sendFairRegistrationNotification({ name, email, phone: phone ?? '', school, eventTitle: event.title as string }),
  ]).catch(err => log.error('career-fair register email', err))

  return NextResponse.json(
    { success: true, registrationId: row.id, guideUrl, recommendedBooths: booths },
    { status: 201 }
  )
}
