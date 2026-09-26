import { interestFromAssessment, recommendBooths, generateCheckinToken, type Booth } from './career-fair'

const BOOTHS: Booth[] = [
  { id: '1', name: 'Tech Corner', category: 'Technology' },
  { id: '2', name: 'Health Hub', category: 'Healthcare & Medicine' },
  { id: '3', name: 'Design Studio', category: 'Creative Arts & Media' },
  { id: '4', name: 'Startup Zone', category: 'Business & Finance' },
]

describe('interestFromAssessment', () => {
  it('maps a top assessment result to its booth category', () => {
    expect(interestFromAssessment([{ key: 'se', score: 9 }])).toBe('Technology')
    expect(interestFromAssessment([{ key: 'hp', score: 8 }])).toBe('Healthcare & Medicine')
  })

  it('returns null for an empty or missing snapshot', () => {
    expect(interestFromAssessment(null)).toBeNull()
    expect(interestFromAssessment(undefined)).toBeNull()
    expect(interestFromAssessment([])).toBeNull()
  })

  it('returns null for an unrecognized key rather than throwing', () => {
    expect(interestFromAssessment([{ key: 'not-a-real-key', score: 5 }])).toBeNull()
  })
})

describe('recommendBooths', () => {
  it('matches booths by the explicitly chosen interest', () => {
    const result = recommendBooths(BOOTHS, 'Technology', null)
    expect(result).toEqual([BOOTHS[0]])
  })

  it('also matches booths implied by the assessment snapshot', () => {
    const result = recommendBooths(BOOTHS, null, [{ key: 'hp', score: 9 }])
    expect(result).toEqual([BOOTHS[1]])
  })

  it('combines both signals without duplicating a booth matched by each', () => {
    const result = recommendBooths(BOOTHS, 'Technology', [{ key: 'se', score: 9 }])
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('Technology')
  })

  it('includes booths for both signals when they differ', () => {
    const result = recommendBooths(BOOTHS, 'Technology', [{ key: 'hp', score: 9 }])
    expect(result.map(b => b.category).sort()).toEqual(['Healthcare & Medicine', 'Technology'])
  })

  it('returns an empty list when there is no signal at all', () => {
    expect(recommendBooths(BOOTHS, null, null)).toEqual([])
  })

  it('returns an empty list (not a crash) when no booth matches the interest', () => {
    expect(recommendBooths(BOOTHS, 'Skilled Trades', null)).toEqual([])
  })
})

describe('generateCheckinToken', () => {
  it('generates a 32-character hex token', () => {
    const token = generateCheckinToken()
    expect(token).toMatch(/^[0-9a-f]{32}$/)
  })

  it('generates a different token each call', () => {
    expect(generateCheckinToken()).not.toBe(generateCheckinToken())
  })
})
