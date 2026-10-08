// Shared option lists + answer shape for the DataCamp scholarship application,
// used by both the public form (components/ScholarshipApplicationForm.tsx)
// and the server (app/api/scholarships/datacamp/route.ts, lib/scholarship-scoring.ts)
// so the two can never drift -- same pattern as lib/career-fair-shared.ts.
//
// Trimmed to a 3-5 minute fill (from an earlier ~27-question, 6-essay version)
// by replacing most free-text essays with checkboxes/selects that still feed
// every scoring dimension in lib/scholarship-scoring.ts -- only one essay
// (motivationEssay) remains.

export const AGE_RANGES = ['16–18', '19–21', '22–25', '26–30', '31–35', '36+'] as const

export const CURRENT_STATUS_OPTIONS = [
  'Secondary school student', 'Undergraduate student', 'Recent graduate', 'Postgraduate student',
  'Employed', 'Self-employed/Freelancer', 'Unemployed', 'Currently seeking employment', 'Other',
] as const

export const EDUCATION_LEVELS = [
  'Secondary school', 'Diploma', "Bachelor's degree", "Master's degree", 'PhD', 'Other',
] as const

export const LEARNING_GOALS = [
  'Data Analytics', 'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Python', 'SQL',
  'Power BI / Data Visualisation', 'Excel / Spreadsheet skills', 'Statistics', 'Programming', 'Other',
] as const

export const EXPERIENCE_LEVELS = [
  'Beginner — little or no experience',
  'Basic — I have started learning',
  'Intermediate — I have completed courses/projects',
  'Advanced — I already use these skills professionally',
] as const

export const SITUATION_OPTIONS = [
  'I cannot currently afford premium learning platforms',
  'I am unemployed',
  'I am underemployed',
  'I am a student with limited financial resources',
  'I am actively looking for employment',
  'I come from a community with limited access to professional training',
  'I am trying to transition into a new career',
  'I am building a business/freelance career',
  'Other',
] as const

export const ACCESS_METHOD_OPTIONS = [
  'I would be unable to afford it',
  'I would have to rely on free resources',
  'I would have to postpone learning',
  'I would try to find another scholarship',
  'I could potentially afford it, but it would be a significant financial burden',
  'Other',
] as const

export const WEEKLY_HOURS_OPTIONS = ['Less than 2 hours', '2–4 hours', '5–7 hours', '8–10 hours', '10+ hours'] as const

// Replaces the old separate deviceAccess/internetAccess selects with one
// combined question -- still enough for the access_barrier red flag.
export const ACCESS_SUPPORT_OPTIONS = [
  'Yes — I have a reliable device and internet access',
  'Partial — I have one but not reliably both',
  'No — I have neither a reliable device nor internet access',
] as const

export const EVIDENCE_OPTIONS = [
  'Portfolio', 'GitHub', 'LinkedIn', 'Previous project', 'Certificate', 'Business/project website', 'Other', 'None yet',
] as const

// Replaces the old free-text impactEssay -- who benefits is just as legible
// from a checklist, and it's a two-second tap instead of a paragraph.
export const IMPACT_AREA_OPTIONS = [
  'Myself', 'My family', 'My community or the people I mentor', 'My employer or my own business', 'Other young people', 'Other',
] as const

export interface ScholarshipAnswers {
  ageRange: typeof AGE_RANGES[number]
  country: string
  stateRegion: string
  city: string
  currentStatus: typeof CURRENT_STATUS_OPTIONS[number]
  educationLevel: typeof EDUCATION_LEVELS[number]

  learningGoals: string[]
  experienceLevel: typeof EXPERIENCE_LEVELS[number]
  motivationEssay: string
  situation: string[]
  accessMethod: typeof ACCESS_METHOD_OPTIONS[number]

  weeklyHours: typeof WEEKLY_HOURS_OPTIONS[number]
  accessSupport: typeof ACCESS_SUPPORT_OPTIONS[number]
  priorCourses: 'Yes' | 'No'
  evidenceTypes: string[]
  impactAreas: string[]

  agreeAll: boolean
  consentSuccessStory?: boolean
}

export interface ScoreBreakdown {
  financialNeed: number
  motivation: number
  careerGoals: number
  commitment: number
  potentialImpact: number
  existingInitiative: number
}

export const SCORE_MAX: ScoreBreakdown = {
  financialNeed: 25,
  motivation: 20,
  careerGoals: 20,
  commitment: 15,
  potentialImpact: 10,
  existingInitiative: 10,
}

export type RedFlag = 'duplicate' | 'inconsistent' | 'thin_answer' | 'access_barrier'

export const RED_FLAG_LABELS: Record<RedFlag, string> = {
  duplicate: 'Duplicate application (same email already applied)',
  inconsistent: 'Inconsistent answers (claims to be employed and unemployed)',
  thin_answer: 'Very short answer to the motivation question',
  access_barrier: 'No device and no internet — may not be able to complete the programme',
}
