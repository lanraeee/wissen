import { z } from 'zod'

// Request bodies for the safeguarding routes. The keys of TriageSchema are
// also the column whitelist for the dynamic UPDATE in
// app/api/admin/whf-cio/safeguarding/[id].

export const PERSON_AT_RISK = ['child', 'adult_at_risk', 'other', 'unknown'] as const
export const RISK_LEVELS = ['unassessed', 'low', 'medium', 'high', 'critical'] as const
export const INCIDENT_STATUSES = ['new', 'triaging', 'referred', 'monitoring', 'closed'] as const
export const CONCERN_TYPES = [
  'physical', 'emotional', 'sexual', 'neglect', 'exploitation', 'online_harm', 'scam_or_fraud',
  'bullying_or_harassment', 'self_harm', 'conduct_of_staff_or_volunteer', 'other',
] as const

const opt = (max: number) => z.string().trim().max(max).nullish().transform(v => v || null)
// For partial updates: an omitted field stays undefined (left alone), while
// an empty string or null clears it.
const clearable = (max: number) => z.string().trim().max(max).nullish().transform(v => (v === undefined ? undefined : v || null))

/** The public report form on /safeguarding. Everything about the reporter is optional: anonymous reports are allowed. */
export const ReportSchema = z.object({
  name: opt(100),
  email: z.string().trim().max(255).email().nullish().or(z.literal('')).transform(v => v || null),
  phone: opt(40),
  relationship: opt(100),
  person_at_risk: z.enum(PERSON_AT_RISK).default('unknown'),
  concern_type: z.enum(CONCERN_TYPES).nullish(),
  description: z.string().trim().min(10, 'Please tell us a little more about what happened').max(8000),
  location: opt(300),
  immediate_danger: z.boolean().optional(),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(200).optional(),
})

export const ManualIncidentSchema = z.object({
  reporter_name: opt(100),
  reporter_email: opt(255),
  reporter_phone: opt(40),
  reporter_relationship: opt(100),
  person_at_risk: z.enum(PERSON_AT_RISK).default('unknown'),
  concern_type: z.enum(CONCERN_TYPES).nullish(),
  description: z.string().trim().min(1).max(8000),
  location: opt(300),
  immediate_danger: z.boolean().optional(),
})

const zDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')

/** What the team updates as they handle a case. The report itself is never edited. */
export const TriageSchema = z.object({
  status: z.enum(INCIDENT_STATUSES).optional(),
  risk_level: z.enum(RISK_LEVELS).optional(),
  concern_type: z.enum(CONCERN_TYPES).nullish(),
  person_at_risk: z.enum(PERSON_AT_RISK).optional(),
  assigned_to: clearable(255),
  actions_taken: clearable(10000),
  referred_to: clearable(500),
  outcome: clearable(5000),
  closed_on: zDate.nullish().or(z.literal('')).transform(v => (v === undefined ? undefined : v || null)),
})

export const TRIAGE_FIELDS = Object.keys(TriageSchema.shape) as (keyof z.infer<typeof TriageSchema>)[]

export const TeamMemberSchema = z.object({
  email: z.string().trim().toLowerCase().max(255).email(),
  name: opt(100),
  role_title: opt(100),
})
