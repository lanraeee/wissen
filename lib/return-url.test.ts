import { safeReturnPath } from './return-url'

describe('safeReturnPath', () => {
  it('allows a same-origin absolute path', () => {
    expect(safeReturnPath('/partners/datacamp/apply')).toBe('/partners/datacamp/apply')
  })

  it('keeps the query string and hash', () => {
    expect(safeReturnPath('/scholarships?tab=wissenhaus-partners')).toBe('/scholarships?tab=wissenhaus-partners')
    expect(safeReturnPath('/community#learning')).toBe('/community#learning')
  })

  it('rejects an absolute URL to another origin', () => {
    expect(safeReturnPath('https://evil.example/phish')).toBeNull()
    expect(safeReturnPath('http://evil.example')).toBeNull()
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeReturnPath('//evil.example/phish')).toBeNull()
  })

  it('rejects a backslash path browsers may treat as protocol-relative', () => {
    expect(safeReturnPath('/\\evil.example')).toBeNull()
  })

  it('rejects values carrying whitespace or control characters', () => {
    expect(safeReturnPath('/community\nLocation: https://evil.example')).toBeNull()
    expect(safeReturnPath('/community and more')).toBeNull()
  })

  it('rejects the auth pages themselves so signing in cannot loop', () => {
    expect(safeReturnPath('/login')).toBeNull()
    expect(safeReturnPath('/login?mode=login')).toBeNull()
    expect(safeReturnPath('/reset-password?token=abc')).toBeNull()
  })

  it('returns null for an absent or empty value', () => {
    expect(safeReturnPath(null)).toBeNull()
    expect(safeReturnPath(undefined)).toBeNull()
    expect(safeReturnPath('')).toBeNull()
  })
})
