import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { parseBody, zEmail, zName } from '@/lib/validation'
import {
  AGE_RANGES, CURRENT_STATUS_OPTIONS, EDUCATION_LEVELS, LEARNING_GOALS, EXPERIENCE_LEVELS,
  SITUATION_OPTIONS, ACCESS_METHOD_OPTIONS, WEEKLY_HOURS_OPTIONS, ACCESS_SUPPORT_OPTIONS,
  EVIDENCE_OPTIONS, IMPACT_AREA_OPTIONS, type ScholarshipAnswers,
} from '@/lib/scholarship-shared'
import { scoreApplication } from '@/lib/scholarship-scoring'
import { sendScholarshipConfirmation, sendScholarshipNotification } from '@/lib/email'
import { runAfterResponse } from '@/lib/background'
import { log } from '@/lib/logger'
import { getSession } from '@/lib/auth'

const ScholarshipSchema = z.object({
  name: zName,
  email: zEmail,
  phone: z.string().trim().max(30).optional(),
  ageRange: z.enum(AGE_RANGES),
  country: z.string().trim().min(1).max(100),
  stateRegion: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),

  currentStatus: z.enum(CURRENT_STATUS_OPTIONS),
  educationLevel: z.enum(EDUCATION_LEVELS),

  learningGoals: z.array(z.enum(LEARNING_GOALS)).min(1).max(3),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  motivationEssay: z.string().trim().min(60).max(3000),
  situation: z.array(z.enum(SITUATION_OPTIONS)).min(1),
  accessMethod: z.enum(ACCESS_METHOD_OPTIONS),

  weeklyHours: z.enum(WEEKLY_HOURS_OPTIONS),
  accessSupport: z.enum(ACCESS_SUPPORT_OPTIONS),
  priorCourses: z.enum(['Yes', 'No']),
  evidenceTypes: z.array(z.enum(EVIDENCE_OPTIONS)).default([]),
  impactAreas: z.array(z.enum(IMPACT_AREA_OPTIONS)).min(1),

  agreeAll: z.literal(true),
  consentSuccessStory: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  // The form page is gated by middleware, but that only stops a browser
  // reaching the page -- without this check the endpoint itself would still
  // accept an anonymous POST. Applying is members-only, so enforce it where
  // the write actually happens.
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Please sign in to apply.' }, { status: 401 })

  const { data, error } = await parseBody(req, ScholarshipSchema)
  if (error) return error
  const { name, email, phone, ageRange, country, stateRegion, city, ...answers } = data
  const normalizedEmail = email.toLowerCase()

  const scored = scoreApplication(answers as ScholarshipAnswers)

  const [existing] = await sql`SELECT 1 FROM scholarship_applications WHERE email = ${normalizedEmail} LIMIT 1`
  const redFlags = existing ? [...scored.redFlags, 'duplicate'] : scored.redFlags

  let row
  try {
    ;[row] = await sql`
      INSERT INTO scholarship_applications
        (name, email, phone, age_range, country, state_region, city, answers, score, score_breakdown, red_flags)
      VALUES (
        ${name}, ${normalizedEmail}, ${phone ?? null}, ${ageRange}, ${country}, ${stateRegion}, ${city},
        ${JSON.stringify(answers)}, ${scored.score}, ${JSON.stringify(scored.breakdown)}, ${redFlags}
      )
      RETURNING id
    `
  } catch (err) {
    log.error('scholarship application insert', err)
    return NextResponse.json({ error: 'Could not submit your application. Please try again.' }, { status: 502 })
  }

  runAfterResponse(() =>
    Promise.all([
      sendScholarshipConfirmation(normalizedEmail, name),
      sendScholarshipNotification({
        name, email: normalizedEmail, score: scored.score, redFlags,
        motivationEssay: answers.motivationEssay,
      }),
    ]).catch(err => log.error('scholarship application email', err))
  )

  return NextResponse.json({ success: true, id: row.id }, { status: 201 })
}
