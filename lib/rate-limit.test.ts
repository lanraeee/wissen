import { hit, findRateLimit, clientIp } from './rate-limit'

describe('hit', () => {
  it('allows requests up to the limit', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      const result = hit(key, 3, 60_000)
      expect(result.ok).toBe(true)
    }
  })

  it('rejects the request once the limit is exceeded', () => {
    const key = `test-${Math.random()}`
    hit(key, 2, 60_000)
    hit(key, 2, 60_000)
    const third = hit(key, 2, 60_000)
    expect(third.ok).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('tracks separate keys independently', () => {
    const keyA = `test-a-${Math.random()}`
    const keyB = `test-b-${Math.random()}`
    hit(keyA, 1, 60_000)
    const bResult = hit(keyB, 1, 60_000)
    expect(bResult.ok).toBe(true)
  })

  it('resets the count after the window has elapsed', async () => {
    const key = `test-window-${Math.random()}`
    hit(key, 1, 10) // 10ms window
    await new Promise(r => setTimeout(r, 20))
    const result = hit(key, 1, 10)
    expect(result.ok).toBe(true)
  })

  it('decrements remaining on each hit within the window', () => {
    const key = `test-remaining-${Math.random()}`
    const first = hit(key, 5, 60_000)
    const second = hit(key, 5, 60_000)
    expect(first.remaining).toBe(4)
    expect(second.remaining).toBe(3)
  })
})

describe('findRateLimit', () => {
  it('matches an exact path', () => {
    expect(findRateLimit('/api/contact')).toMatchObject({ limit: 5 })
  })

  it('matches a nested path under a prefix', () => {
    expect(findRateLimit('/api/auth/login')).toMatchObject({ limit: 10 })
  })

  it('does not match an unrelated path', () => {
    expect(findRateLimit('/api/unrelated-route')).toBeUndefined()
  })

  it('does not match a path that merely starts with the same characters', () => {
    // /api/contactus should NOT match the /api/contact rule
    expect(findRateLimit('/api/contactus')).toBeUndefined()
  })
})

describe('clientIp', () => {
  it('prefers x-vercel-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-vercel-forwarded-for': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' },
    })
    expect(clientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-forwarded-for', () => {
    const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '5.6.7.8, 9.9.9.9' } })
    expect(clientIp(req)).toBe('5.6.7.8')
  })

  it('falls back to unknown when no IP headers are present', () => {
    const req = new Request('http://localhost')
    expect(clientIp(req)).toBe('unknown')
  })
})
