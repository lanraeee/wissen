import { NextRequest } from 'next/server'
import { middleware } from './middleware'
import { signViewAs, VIEW_AS_COOKIE } from './lib/view-as-shared'
import { SignJWT } from 'jose'

const claims = {
  id: 'member-1', email: 'm@example.com', name: 'Member One', role: 'user' as const,
  viewer: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
}

function req(method: string, path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  return new NextRequest(`https://www.wissenhaus.org${path}`, {
    method,
    headers: cookie ? { cookie } : {},
  })
}

describe('middleware: read-only while viewing as a member', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long'
  })

  it('refuses an API write while a view is live', async () => {
    const view = await signViewAs(claims)
    const res = await middleware(req('POST', '/api/forum/threads', { [VIEW_AS_COOKIE]: view, wh_token: 'x' }))
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/Read-only/) })
  })

  it('refuses a page-level write (form or server action) while a view is live', async () => {
    const view = await signViewAs(claims)
    const res = await middleware(req('POST', '/profile', { [VIEW_AS_COOKIE]: view }))
    expect(res.status).toBe(403)
  })

  it('still allows reads while a view is live', async () => {
    const view = await signViewAs(claims)
    const res = await middleware(req('GET', '/api/forum/threads', { [VIEW_AS_COOKIE]: view }))
    expect(res.status).not.toBe(403)
  })

  it('lets the exit endpoint through while a view is live', async () => {
    const view = await signViewAs(claims)
    const res = await middleware(req('POST', '/api/view-as/exit', { [VIEW_AS_COOKIE]: view }))
    expect(res.status).not.toBe(403)
  })

  it('does not block writes when there is no view cookie', async () => {
    const res = await middleware(req('POST', '/api/forum/threads'))
    expect(res.status).not.toBe(403)
  })

  it('does not block writes for an invalid or expired view cookie', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const past = Math.floor(Date.now() / 1000) - 3600
    const expired = await new SignJWT({ ...claims, typ: 'view-as' })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt(past - 10).setExpirationTime(past).sign(secret)
    const res = await middleware(req('POST', '/api/forum/threads', { [VIEW_AS_COOKIE]: expired }))
    expect(res.status).not.toBe(403)
  })
})
