import { normaliseModel, resolveProvider, providerKey, callMessages } from './ai-provider'

const saved = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  gateway: process.env.AI_GATEWAY_API_KEY,
  oidc: process.env.VERCEL_OIDC_TOKEN,
}

function setKeys(opts: { anthropic?: string; gateway?: string; oidc?: string }) {
  for (const [env, val] of [
    ['ANTHROPIC_API_KEY', opts.anthropic],
    ['AI_GATEWAY_API_KEY', opts.gateway],
    ['VERCEL_OIDC_TOKEN', opts.oidc],
  ] as const) {
    if (val === undefined) delete process.env[env]
    else process.env[env] = val
  }
}

afterEach(() => {
  setKeys({ anthropic: saved.anthropic, gateway: saved.gateway, oidc: saved.oidc })
  vi.unstubAllGlobals()
})

// The gateway namespaces models by provider and Anthropic direct does not.
// Getting this wrong is a 400 or a "model not found" -- the same class of
// silent failure that had every chat handing off to a human.
describe('normaliseModel', () => {
  it('adds the provider prefix for the gateway', () => {
    expect(normaliseModel('claude-sonnet-5', 'vercel')).toBe('anthropic/claude-sonnet-5')
  })

  it('strips the prefix for Anthropic direct', () => {
    expect(normaliseModel('anthropic/claude-sonnet-5', 'anthropic')).toBe('claude-sonnet-5')
  })

  // Flipping the switch must not require editing the model field, so both
  // spellings have to survive a round trip in either direction.
  it('is idempotent in both directions', () => {
    expect(normaliseModel('anthropic/claude-sonnet-5', 'vercel')).toBe('anthropic/claude-sonnet-5')
    expect(normaliseModel('claude-sonnet-5', 'anthropic')).toBe('claude-sonnet-5')
  })
})

describe('resolveProvider', () => {
  it('uses Anthropic direct with the right header and URL', () => {
    setKeys({ anthropic: 'sk-test' })
    const p = resolveProvider('anthropic')!
    expect(p.provider).toBe('anthropic')
    expect(p.url).toBe('https://api.anthropic.com/v1/messages')
    expect(p.headers['x-api-key']).toBe('sk-test')
    expect(p.headers['anthropic-version']).toBe('2023-06-01')
  })

  it('uses the gateway with a bearer token and no anthropic-version header', () => {
    setKeys({ gateway: 'gw-test' })
    const p = resolveProvider('vercel')!
    expect(p.provider).toBe('vercel')
    expect(p.url).toBe('https://ai-gateway.vercel.sh/v1/messages')
    expect(p.headers.authorization).toBe('Bearer gw-test')
    expect(p.headers['anthropic-version']).toBeUndefined()
  })

  // Deployed functions get an OIDC token automatically, so the gateway can
  // work in production with no key set by hand -- and not locally.
  it('falls back to the OIDC token for the gateway', () => {
    setKeys({ oidc: 'oidc-test' })
    expect(providerKey('vercel')).toBe('oidc-test')
    expect(resolveProvider('vercel')!.headers.authorization).toBe('Bearer oidc-test')
  })

  // A preference for a provider with no credential should not take the agent
  // down when the other one is configured.
  it('falls back to the other provider rather than failing', () => {
    setKeys({ anthropic: 'sk-test' })
    expect(resolveProvider('vercel')!.provider).toBe('anthropic')

    setKeys({ gateway: 'gw-test' })
    expect(resolveProvider('anthropic')!.provider).toBe('vercel')
  })

  it('returns null when neither provider has a credential', () => {
    setKeys({})
    expect(resolveProvider('anthropic')).toBeNull()
    expect(resolveProvider('vercel')).toBeNull()
  })
})

describe('callMessages', () => {
  it('rewrites the model to match the route actually taken', async () => {
    setKeys({ gateway: 'gw-test' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await callMessages(resolveProvider('vercel')!, {
      model: 'claude-sonnet-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://ai-gateway.vercel.sh/v1/messages')
    expect(JSON.parse(init.body).model).toBe('anthropic/claude-sonnet-5')
  })

  it('leaves the rest of the request body untouched', async () => {
    setKeys({ anthropic: 'sk-test' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await callMessages(resolveProvider('anthropic')!, {
      model: 'anthropic/claude-sonnet-5',
      max_tokens: 600,
      system: 'rules',
      tools: [{ name: 'run_sql' }],
      messages: [{ role: 'user', content: 'hi' }],
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.model).toBe('claude-sonnet-5')
    expect(body.max_tokens).toBe(600)
    expect(body.system).toBe('rules')
    expect(body.tools).toEqual([{ name: 'run_sql' }])
  })
})
