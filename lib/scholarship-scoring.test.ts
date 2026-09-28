import { scoreApplication } from './scholarship-scoring'
import type { ScholarshipAnswers } from './scholarship-shared'

const LONG_ESSAY = Array(160).fill('word').join(' ') // 160 words -- top bucket for every essay question
const SHORT_ESSAY = 'too short'

function baseAnswers(overrides: Partial<ScholarshipAnswers> = {}): ScholarshipAnswers {
  return {
    ageRange: '19–21',
    country: 'Nigeria', stateRegion: 'Oyo', city: 'Ibadan',
    currentStatus: 'Unemployed',
    educationLevel: "Bachelor's degree",
    learningGoals: ['Python', 'SQL'],
    experienceLevel: 'Beginner — little or no experience',
    goalsEssay: LONG_ESSAY,
    whyApplyingEssay: LONG_ESSAY,
    situation: ['I cannot currently afford premium learning platforms', 'I am unemployed'],
    accessMethod: 'I would be unable to afford it',
    weeklyHours: '5–7 hours',
    deviceAccess: 'Yes — personal laptop',
    internetAccess: 'Yes',
    planEssay: LONG_ESSAY,
    visionEssay: LONG_ESSAY,
    impactEssay: LONG_ESSAY,
    priorCourses: 'No',
    evidenceTypes: ['None yet'],
    tieBreakerEssay: LONG_ESSAY,
    agreeCommitments: true,
    agreeNoResale: true,
    consentContact: true,
    ...overrides,
  }
}

describe('scoreApplication', () => {
  it('scores a strong, consistent application highly with no red flags', () => {
    const { score, breakdown, redFlags } = scoreApplication(baseAnswers({
      situation: ['a', 'b', 'c', 'd', 'e'],
      learningGoals: ['Python', 'SQL', 'Statistics'],
      weeklyHours: '10+ hours',
      priorCourses: 'Yes',
      evidenceTypes: ['GitHub'],
    }))
    expect(score).toBeGreaterThan(85)
    expect(breakdown.financialNeed).toBeLessThanOrEqual(25)
    expect(redFlags).toEqual([])
  })

  it('caps financial-need points even with every barrier checkbox ticked', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] // 7 boxes * 3 = 21, capped at 15 + 10 access = 25
    const { breakdown } = scoreApplication(baseAnswers({ situation: many }))
    expect(breakdown.financialNeed).toBe(25)
  })

  it('never zeroes existing-initiative for "None yet" evidence and no prior courses', () => {
    const { breakdown } = scoreApplication(baseAnswers({ evidenceTypes: ['None yet'], priorCourses: 'No' }))
    expect(breakdown.existingInitiative).toBe(4)
  })

  it('rewards beginners more than advanced learners on career/education goals', () => {
    const beginner = scoreApplication(baseAnswers({ experienceLevel: 'Beginner — little or no experience' }))
    const advanced = scoreApplication(baseAnswers({ experienceLevel: 'Advanced — I already use these skills professionally' }))
    expect(beginner.breakdown.careerGoals).toBeGreaterThan(advanced.breakdown.careerGoals)
  })

  it('flags inconsistent answers (claims employed and unemployed)', () => {
    const { redFlags } = scoreApplication(baseAnswers({ currentStatus: 'Employed', situation: ['I am unemployed'] }))
    expect(redFlags).toContain('inconsistent')
  })

  it('flags thin answers below the word-count floor', () => {
    const { redFlags } = scoreApplication(baseAnswers({ goalsEssay: SHORT_ESSAY, tieBreakerEssay: SHORT_ESSAY }))
    expect(redFlags).toContain('thin_answer')
  })

  it('flags no-device-and-no-internet as an access barrier', () => {
    const { redFlags } = scoreApplication(baseAnswers({ deviceAccess: 'No', internetAccess: 'No' }))
    expect(redFlags).toContain('access_barrier')
  })

  it('does not flag access barrier when only one of device/internet is missing', () => {
    const { redFlags } = scoreApplication(baseAnswers({ deviceAccess: 'No', internetAccess: 'Mostly' }))
    expect(redFlags).not.toContain('access_barrier')
  })
})
