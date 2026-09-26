// Client-safe pieces of the Career Fair feature: types and constants only,
// no Node built-ins. Split out from lib/career-fair.ts (which imports
// 'crypto' for token generation) so client components -- e.g. the public
// registration form -- can import these without pulling a Node module into
// the browser bundle.

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

export interface AssessmentSnapshot {
  key: string
  score: number
  reasons?: string[]
}
