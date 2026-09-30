import { mintAccessToken, mintMagicToken, ticketFromToken } from './ticket-access'

const TID = '3c6dcf8b-21a8-4440-a51f-40ce270e2dfe'
const REF = 'WH-T6C36-KEPFT'

// jwtSecret() reads the env var per call and throws when it is missing, so
// these tests supply their own rather than depending on a developer's
// .env.local being loaded. Same pattern as lib/auth.test.ts.
const originalSecret = process.env.JWT_SECRET

describe('ticket access tokens', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long' })
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  })

  it('round-trips an access token for its own ticket', async () => {
    const token = await mintAccessToken(TID, REF)
    expect(await ticketFromToken(token, REF, 'access')).toBe(TID)
  })

  // The reference is in the signed payload precisely so a token cannot be
  // lifted from one conversation and replayed against another.
  it('refuses a token minted for a different reference', async () => {
    const token = await mintAccessToken(TID, REF)
    expect(await ticketFromToken(token, 'WH-OTHER-REFER', 'access')).toBeNull()
  })

  // A magic link is emailed and lives in an inbox; an access token is a
  // long-lived cookie. Letting one stand in for the other would give an old
  // forwarded email the lifetime of a session.
  it('does not accept a magic token where an access token is required', async () => {
    const token = await mintMagicToken(TID, REF)
    expect(await ticketFromToken(token, REF, 'access')).toBeNull()
  })

  it('does not accept an access token where a magic token is required', async () => {
    const token = await mintAccessToken(TID, REF)
    expect(await ticketFromToken(token, REF, 'magic')).toBeNull()
  })

  it('refuses a tampered or absent token', async () => {
    expect(await ticketFromToken('not.a.token', REF, 'access')).toBeNull()
    expect(await ticketFromToken(undefined, REF, 'access')).toBeNull()
    const token = await mintAccessToken(TID, REF)
    expect(await ticketFromToken(token.slice(0, -2) + 'xx', REF, 'access')).toBeNull()
  })
})
