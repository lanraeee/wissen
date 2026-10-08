import { scoreApplication } from './scholarship-scoring'
import type { ScholarshipAnswers } from './scholarship-shared'

const LONG_ESSAY = Array(190).fill('word').join(' ') // 190 words -- top bucket for the motivation question
const SHORT_ESSAY = 'too short'

function baseAnswers(overrides: Partial<ScholarshipAnswers> = {}): ScholarshipAnswers {
  return {
    ageRange: '19–21',
    country: 'Nigeria', stateRegion: 'Oyo', city: 'Ibadan',
    currentStatus: 'Unemployed',
    educationLevel: "Bachelor's degree",
    learningGoals: ['Python', 'SQL'],
    experienceLevel: 'Beginner — little or no experience',
    motivationEssay: LONG_ESSAY,
    situation: ['I cannot currently afford premium learning platforms', 'I am unemployed'],
    accessMethod: 'I would be unable to afford it',
    weeklyHours: '5–7 hours',
    accessSupport: 'Yes — I have a reliable device and internet access',
    priorCourses: 'No',
    evidenceTypes: ['None yet'],
    impactAreas: ['Myself'],
    agreeAll: true,
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
      impactAreas: ['Myself', 'My family', 'Other young people'],
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

  it('rewards more impact areas with a higher potential-impact score', () => {
    const one = scoreApplication(baseAnswers({ impactAreas: ['Myself'] }))
    const three = scoreApplication(baseAnswers({ impactAreas: ['Myself', 'My family', 'Other young people'] }))
    expect(three.breakdown.potentialImpact).toBeGreaterThan(one.breakdown.potentialImpact)
  })

  it('flags inconsistent answers (claims employed and unemployed)', () => {
    const { redFlags } = scoreApplication(baseAnswers({ currentStatus: 'Employed', situation: ['I am unemployed'] }))
    expect(redFlags).toContain('inconsistent')
  })

  it('flags thin answers below the word-count floor', () => {
    const { redFlags } = scoreApplication(baseAnswers({ motivationEssay: SHORT_ESSAY }))
    expect(redFlags).toContain('thin_answer')
  })

  it('flags having neither a device nor internet as an access barrier', () => {
    const { redFlags } = scoreApplication(baseAnswers({ accessSupport: 'No — I have neither a reliable device nor internet access' }))
    expect(redFlags).toContain('access_barrier')
  })

  it('does not flag access barrier when support is only partial', () => {
    const { redFlags } = scoreApplication(baseAnswers({ accessSupport: 'Partial — I have one but not reliably both' }))
    expect(redFlags).not.toContain('access_barrier')
  })
})
