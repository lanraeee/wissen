import { hashPassword, verifyPassword, signToken, verifyToken, type UserPayload } from './auth'

const basePayload: UserPayload = { id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace' }

describe('password hashing', () => {
  it('hashes and verifies a matching password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
  })

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('wrong password', hash)).toBe(false)
  })

  it('produces a different hash each time (salted)', async () => {
    const [a, b] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')])
    expect(a).not.toBe(b)
  })
})

describe('JWT signing and verification', () => {
  const originalSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret
  })

  it('round-trips a payload through sign and verify', async () => {
    const token = await signToken(basePayload)
    const verified = await verifyToken(token)
    expect(verified.id).toBe(basePayload.id)
    expect(verified.email).toBe(basePayload.email)
    expect(verified.name).toBe(basePayload.name)
  })

  it('preserves optional fields (role, membershipExpiry)', async () => {
    const token = await signToken({ ...basePayload, role: 'admin', membershipExpiry: '2030-01-01' })
    const verified = await verifyToken(token)
    expect(verified.role).toBe('admin')
    expect(verified.membershipExpiry).toBe('2030-01-01')
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await signToken(basePayload)
    process.env.JWT_SECRET = 'a-completely-different-secret-value-here'
    await expect(verifyToken(token)).rejects.toThrow()
  })

  it('rejects a tampered token', async () => {
    const token = await signToken(basePayload)
    const tampered = token.slice(0, -4) + 'abcd'
    await expect(verifyToken(tampered)).rejects.toThrow()
  })

  it('rejects garbage input', async () => {
    await expect(verifyToken('not.a.jwt')).rejects.toThrow()
  })
})
