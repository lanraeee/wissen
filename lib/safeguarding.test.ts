vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue([]) }))
vi.mock('./email', () => ({ notifySafeguardingTeam: vi.fn() }))

import { looksLikeSafeguarding, newReference, getSafeguardingTeamEmails, SAFEGUARDING_LEAD_EMAIL } from './safeguarding'
import { canAccessAdminPath } from './admin-access'

describe('looksLikeSafeguarding', () => {
  it.each([
    'Safeguarding concern about a mentor',
    'I think a student is being groomed online', // groomed
    'He was abusive to her',
    'worried about self-harm',
  ])('flags %j', text => expect(looksLikeSafeguarding(text)).toBe(true))

  it.each([
    'Question about the Career Clarity Fair',
    'Can I volunteer as a mentor?',
  ])('does not flag %j', text => expect(looksLikeSafeguarding(text)).toBe(false))
})

it('references are SG- plus ten unambiguous characters', () => {
  expect(newReference()).toMatch(/^SG-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/)
})

it('the lead address is always on the team, even with no rows', async () => {
  expect(SAFEGUARDING_LEAD_EMAIL).toBe('safeguarding@wissenhaus.org')
  expect(await getSafeguardingTeamEmails()).toEqual(['safeguarding@wissenhaus.org'])
})

describe('safeguarding role paths', () => {
  it('reaches WHF-CIO Records and nothing else', () => {
    expect(canAccessAdminPath('safeguarding', '/admin/whf-cio')).toBe(true)
    expect(canAccessAdminPath('safeguarding', '/admin')).toBe(false)
    expect(canAccessAdminPath('safeguarding', '/admin/users')).toBe(false)
    expect(canAccessAdminPath('safeguarding', '/admin/contact')).toBe(false)
    expect(canAccessAdminPath('safeguarding', '/admin/ai', true)).toBe(false)
  })
})

describe('TriageSchema', () => {
  it('leaves omitted fields alone and clears empty ones', async () => {
    const { TriageSchema } = await import('./safeguarding-schema')
    expect(TriageSchema.parse({ status: 'triaging', outcome: '' })).toEqual({ status: 'triaging', outcome: null })
  })
})
