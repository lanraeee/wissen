import { validateProof } from './bank-transfer'

vi.mock('@/lib/db', () => ({ default: () => Promise.resolve([]) }))

describe('validateProof', () => {
  const MB = 1024 * 1024

  it('accepts a PDF, PNG or JPG receipt up to 4 MB', () => {
    expect(validateProof({ size: 200 * 1024, type: 'application/pdf' })).toBeNull()
    expect(validateProof({ size: 1 * MB, type: 'image/png' })).toBeNull()
    expect(validateProof({ size: 4 * MB, type: 'image/jpeg' })).toBeNull()
  })

  it('refuses an empty file', () => {
    expect(validateProof({ size: 0, type: 'image/png' })).toMatch(/empty/)
  })

  it('refuses a file over 4 MB', () => {
    expect(validateProof({ size: 4 * MB + 1, type: 'application/pdf' })).toMatch(/too large/)
  })

  it('refuses types other than PDF, PNG and JPG', () => {
    expect(validateProof({ size: 1000, type: 'application/msword' })).toMatch(/PDF, PNG or JPG/)
    expect(validateProof({ size: 1000, type: 'text/html' })).toMatch(/PDF, PNG or JPG/)
  })
})
