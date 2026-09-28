import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { parseBody, zEmail, zName } from '@/lib/validation'
import {
  AGE_RANGES, CURRENT_STATUS_OPTIONS, EDUCATION_LEVELS, LEARNING_GOALS, EXPERIENCE_LEVELS,
  SITUATION_OPTIONS, ACCESS_METHOD_OPTIONS, WEEKLY_HOURS_OPTIONS, DEVICE_OPTIONS, INTERNET_OPTIONS,
  EVIDENCE_OPTIONS, type ScholarshipAnswers,
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
  fieldOfStudy: z.string().trim().max(200).optional(),

  learningGoals: z.array(z.enum(LEARNING_GOALS)).min(1).max(3),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  goalsEssay: z.string().trim().min(50).max(3000),

  whyApplyingEssay: z.string().trim().min(50).max(3000),
  situation: z.array(z.enum(SITUATION_OPTIONS)).min(1),
  accessMethod: z.enum(ACCESS_METHOD_OPTIONS),

  weeklyHours: z.enum(WEEKLY_HOURS_OPTIONS),
  deviceAccess: z.enum(DEVICE_OPTIONS),
  internetAccess: z.enum(INTERNET_OPTIONS),
  planEssay: z.string().trim().min(20).max(2000),

  visionEssay: z.string().trim().min(20).max(2000),
  impactEssay: z.string().trim().min(1).max(2000),
  priorCourses: z.enum(['Yes', 'No']),
  priorCoursesDetail: z.string().trim().max(1000).optional(),

  evidenceTypes: z.array(z.enum(EVIDENCE_OPTIONS)).default([]),
  evidenceUrl: z.string().trim().max(500).optional(),

  tieBreakerEssay: z.string().trim().min(10).max(1000),

  agreeCommitments: z.literal(true),
  agreeNoResale: z.literal(true),
  consentContact: z.literal(true),
  consentSuccessStory: z.boolean().optional(),
}).refine(
  data => data.priorCourses === 'No' || !!data.priorCoursesDetail?.trim(),
  { message: 'priorCoursesDetail: Please tell us about the courses you completed', path: ['priorCoursesDetail'] },
)

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
        goalsEssay: answers.goalsEssay, whyApplyingEssay: answers.whyApplyingEssay,
      }),
    ]).catch(err => log.error('scholarship application email', err))
  )

  return NextResponse.json({ success: true, id: row.id }, { status: 201 })
}
