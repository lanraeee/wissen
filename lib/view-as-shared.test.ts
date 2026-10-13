import { viewAsRefusal, signViewAs, verifyViewAs, viewAsMetaValue, VIEW_AS_TTL_SECONDS } from './view-as-shared'
import { SignJWT } from 'jose'

const VIEWER = 'admin-1'
const member = { id: 'member-1', role: 'user', protected: false }

describe('viewAsRefusal', () => {
  it('allows viewing an ordinary member', () => {
    expect(viewAsRefusal(VIEWER, member)).toBeNull()
  })

  it('refuses viewing your own account', () => {
    expect(viewAsRefusal(VIEWER, { ...member, id: VIEWER })).toMatch(/own account/)
  })

  it('refuses protected accounts (master admin, blocked admins)', () => {
    expect(viewAsRefusal(VIEWER, { ...member, protected: true })).toMatch(/cannot be viewed/)
  })

  it.each(['admin', 'editor', 'trustee'])('refuses staff accounts with role %s', role => {
    expect(viewAsRefusal(VIEWER, { ...member, role })).toMatch(/Only member accounts/)
  })

  it.each(['admin', 'editor', 'trustee', 'user'])('lets the master admin view any %s account', role => {
    expect(viewAsRefusal(VIEWER, { ...member, role }, true)).toBeNull()
  })

  it('lets the master admin view a protected account', () => {
    expect(viewAsRefusal(VIEWER, { ...member, protected: true, role: 'admin' }, true)).toBeNull()
  })

  it('still refuses the master admin viewing their own account', () => {
    expect(viewAsRefusal(VIEWER, { ...member, id: VIEWER }, true)).toMatch(/own account/)
  })
})

describe('view-as tokens', () => {
  const claims = {
    id: 'member-1',
    email: 'member@example.com',
    name: 'Member One',
    role: 'user' as const,
    membershipExpiry: null,
    viewer: { id: VIEWER, email: 'admin@example.com', role: 'admin' },
  }

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long'
  })

  it('round-trips a valid view token', async () => {
    const token = await signViewAs(claims)
    const back = await verifyViewAs(token)
    expect(back?.id).toBe('member-1')
    expect(back?.viewer.id).toBe(VIEWER)
    expect(back?.role).toBe('user')
  })

  it('rejects a missing token', async () => {
    expect(await verifyViewAs(undefined)).toBeNull()
    expect(await verifyViewAs('')).toBeNull()
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await signViewAs(claims)
    process.env.JWT_SECRET = 'a-different-secret-that-is-also-long-enough'
    expect(await verifyViewAs(token)).toBeNull()
  })

  it('rejects an ordinary session token that lacks the view-as type', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const plain = await new SignJWT({ ...claims }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(secret)
    expect(await verifyViewAs(plain)).toBeNull()
  })

  it('rejects an expired view token', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const past = Math.floor(Date.now() / 1000) - VIEW_AS_TTL_SECONDS - 60
    const expired = await new SignJWT({ ...claims, typ: 'view-as' })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt(past - 10).setExpirationTime(past).sign(secret)
    expect(await verifyViewAs(expired)).toBeNull()
  })
})

describe('viewAsMetaValue', () => {
  it('encodes a name and expiry the banner can read back', () => {
    const when = new Date('2026-10-11T10:30:00.000Z')
    const parsed = JSON.parse(decodeURIComponent(viewAsMetaValue('Ada Lovelace', when)))
    expect(parsed).toEqual({ name: 'Ada Lovelace', expiresAt: '2026-10-11T10:30:00.000Z' })
  })
})
