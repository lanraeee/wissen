// Shared types and logic for the Career Clarity Fair registration + booth
// recommendation feature. See docs/adr/008-career-fair-assessment-link.md
// for why assessment linkage is a best-effort localStorage snapshot rather
// than a real account-linked lookup.

import { randomBytes } from 'crypto'

export interface Booth {
  id: string
  name: string
  category: string
  location?: string
  description?: string
}

export interface FairEvent {
  id: number
  slug: string
  title: string
  school: string | null
  location: string | null
  event_date: string | null
  event_time: string | null
  status: 'draft' | 'published' | 'closed'
  description: string | null
  booths: Booth[]
  created_at: string
  updated_at: string
}

// Registration-form dropdown + the category each booth is tagged with.
// Kept deliberately short (a fair has dozens of booths, not hundreds of
// categories) so both the form and admin booth editor stay usable.
export const CAREER_INTERESTS = [
  'Technology',
  'Healthcare & Medicine',
  'Business & Finance',
  'Creative Arts & Media',
  'Engineering',
  'Law, Policy & Social Impact',
  'Education',
  'Skilled Trades',
  'Science & Research',
  'Other',
] as const

export type CareerInterest = typeof CAREER_INTERESTS[number]

export const CLASS_GRADES = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'] as const

// The 12 keys/titles from the Career Assessment Accelerator (app/career-assessment),
// which stores its results client-side only (localStorage key
// 'wh_assessmentResults') -- not duplicated here in full, just enough to turn
// a stored { key, score } back into a category for booth matching.
const ASSESSMENT_KEY_TO_INTEREST: Record<string, CareerInterest> = {
  pm: 'Technology',
  da: 'Technology',
  se: 'Technology',
  ux: 'Creative Arts & Media',
  sim: 'Law, Policy & Social Impact',
  te: 'Education',
  hp: 'Healthcare & Medicine',
  en: 'Business & Finance',
  mm: 'Business & Finance',
  fp: 'Business & Finance',
  cc: 'Creative Arts & Media',
  pa: 'Law, Policy & Social Impact',
}

export interface AssessmentSnapshot {
  key: string
  score: number
  reasons?: string[]
}

/** Best-effort: turns a stored top assessment result into a booth category. */
export function interestFromAssessment(snapshot: AssessmentSnapshot[] | null | undefined): CareerInterest | null {
  const top = snapshot?.[0]
  if (!top) return null
  return ASSESSMENT_KEY_TO_INTEREST[top.key] ?? null
}

/**
 * Recommends booths for a registrant: their explicitly chosen interest first
 * (it's a direct signal), then whatever their assessment snapshot implies
 * (in case it differs), each de-duplicated. Callers show "recommended" vs
 * "everything else" -- this never excludes booths, just orders them.
 */
export function recommendBooths(
  booths: Booth[],
  careerInterest: string | null | undefined,
  assessmentSnapshot: AssessmentSnapshot[] | null | undefined
): Booth[] {
  const wanted = new Set<string>()
  if (careerInterest) wanted.add(careerInterest)
  const fromAssessment = interestFromAssessment(assessmentSnapshot)
  if (fromAssessment) wanted.add(fromAssessment)
  if (wanted.size === 0) return []
  return booths.filter(b => wanted.has(b.category))
}

export function generateCheckinToken(): string {
  // Short enough to put in a URL/QR code, long enough not to be guessable --
  // same approach as the password-reset token in app/api/auth/forgot-password.
  return randomBytes(16).toString('hex')
}
