import type { ScholarshipAnswers, ScoreBreakdown, RedFlag } from './scholarship-shared'

function wordCount(text: string | undefined): number {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0
}

// Financial/access need -- 25pts: one point per genuine barrier checkbox
// (capped, so ticking every box isn't a shortcut to a perfect score) plus
// how the applicant says they'd access DataCamp without this scholarship.
function scoreFinancialNeed(a: ScholarshipAnswers): number {
  const barrierPoints = Math.min(a.situation.length * 3, 15)
  const accessPoints: Record<string, number> = {
    'I would be unable to afford it': 10,
    'I would have to postpone learning': 8,
    'I would have to rely on free resources': 7,
    'I would try to find another scholarship': 6,
    'I could potentially afford it, but it would be a significant financial burden': 4,
    'Other': 3,
  }
  return Math.min(barrierPoints + (accessPoints[a.accessMethod] ?? 0), 25)
}

// Motivation -- 20pts, from the single free-text motivation question. Length
// is used only as a structural proxy for effort, never as a judgment of the
// writing's quality -- reviewers read the actual answer.
function scoreMotivation(a: ScholarshipAnswers): number {
  const words = wordCount(a.motivationEssay)
  if (words < 40) return 6
  if (words < 100) return 12
  if (words < 180) return 17
  return 20
}

// Career/education goals -- 20pts. Weighted toward beginners/basic learners
// on purpose: this scholarship is for people who could become stronger
// because they were given access, not a reward for the strongest CVs.
function scoreCareerGoals(a: ScholarshipAnswers): number {
  const goalPoints = Math.min(a.learningGoals.length * 4, 12)
  const experiencePoints: Record<string, number> = {
    'Beginner — little or no experience': 8,
    'Basic — I have started learning': 6,
    'Intermediate — I have completed courses/projects': 4,
    'Advanced — I already use these skills professionally': 2,
  }
  return goalPoints + (experiencePoints[a.experienceLevel] ?? 0)
}

// Commitment to learning -- 15pts, from stated weekly time commitment.
function scoreCommitment(a: ScholarshipAnswers): number {
  const hoursPoints: Record<string, number> = {
    'Less than 2 hours': 3, '2–4 hours': 7, '5–7 hours': 11, '8–10 hours': 14, '10+ hours': 15,
  }
  return hoursPoints[a.weeklyHours] ?? 0
}

// Potential impact -- 10pts, from how many groups the applicant says their
// new skills would reach (a checklist, not an essay -- see impactAreas).
function scorePotentialImpact(a: ScholarshipAnswers): number {
  const count = a.impactAreas.length
  if (count === 0) return 0
  if (count === 1) return 4
  if (count === 2) return 7
  return 10
}

// Existing initiative -- 10pts, with a floor so "None yet" for evidence never
// zeroes this category (the form's own copy promises exactly that).
function scoreExistingInitiative(a: ScholarshipAnswers): number {
  let score = 4
  if (a.priorCourses === 'Yes') score += 3
  const hasEvidence = a.evidenceTypes.some(t => t !== 'None yet')
  if (hasEvidence) score += 3
  return Math.min(score, 10)
}

export function scoreApplication(a: ScholarshipAnswers): { score: number; breakdown: ScoreBreakdown; redFlags: RedFlag[] } {
  const breakdown: ScoreBreakdown = {
    financialNeed: scoreFinancialNeed(a),
    motivation: scoreMotivation(a),
    careerGoals: scoreCareerGoals(a),
    commitment: scoreCommitment(a),
    potentialImpact: scorePotentialImpact(a),
    existingInitiative: scoreExistingInitiative(a),
  }
  const score = Object.values(breakdown).reduce((sum, n) => sum + n, 0)

  const redFlags: RedFlag[] = []
  const claimsEmployed = a.currentStatus === 'Employed' || a.currentStatus === 'Self-employed/Freelancer'
  if (claimsEmployed && a.situation.includes('I am unemployed')) redFlags.push('inconsistent')
  if (wordCount(a.motivationEssay) < 40) redFlags.push('thin_answer')
  if (a.accessSupport === 'No — I have neither a reliable device nor internet access') redFlags.push('access_barrier')

  return { score, breakdown, redFlags }
}
