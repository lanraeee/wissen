const sqlMock = vi.fn()
vi.mock('@/lib/db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }))

import { answerSupportQuestion, isAgentConfigured, MONTHLY_CALL_CAP } from './support-agent'

const originalKey = process.env.ANTHROPIC_API_KEY

describe('support agent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock.mockResolvedValue([])
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = originalKey
  })

  it('reports itself unconfigured without an API key', async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(isAgentConfigured()).toBe(false)
    const result = await answerSupportQuestion([], 'What courses do you offer?')
    expect(result).toEqual({ status: 'unavailable', reason: 'not_configured' })
  })

  // Spending money is the failure mode that matters here: a bad answer is
  // recoverable, an unbounded Anthropic bill on a foundation's card is not.
  it('refuses to call once the monthly cap is reached', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    sqlMock
      .mockResolvedValueOnce([])                               // ai_settings -> defaults
      .mockResolvedValueOnce([{ calls: MONTHLY_CALL_CAP }])    // ai_usage
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await answerSupportQuestion([], 'hello')

    expect(result).toEqual({ status: 'unavailable', reason: 'cap_reached' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // If the ledger cannot be read we cannot prove we are under the cap, so we
  // must not spend. Failing closed on a billing guard is the safe default.
  it('fails closed when the usage ledger cannot be read', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    sqlMock
      .mockResolvedValueOnce([])                        // ai_settings -> defaults
      .mockRejectedValue(new Error('db down'))          // everything after
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await answerSupportQuestion([], 'hello')

    expect(result.status).toBe('unavailable')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('parses a reply and its escalation flag', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ calls: 1 }])
      .mockResolvedValueOnce([{ key: 'foundation_details', value: { name: 'Wissen-Haus' } }])
      .mockResolvedValue([])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '"reply": "We run free courses.", "escalate": false}' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    }))

    const result = await answerSupportQuestion([], 'Do you charge for courses?')

    expect(result).toEqual({ status: 'ok', reply: 'We run free courses.', escalate: false })
  })

  it('treats an Anthropic error as unavailable rather than throwing', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ calls: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValue([])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 529, json: async () => ({}) }))

    const result = await answerSupportQuestion([], 'hello')

    expect(result).toEqual({ status: 'unavailable', reason: 'error' })
  })

  it('sends only the last few turns, so history cannot grow the bill', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ calls: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValue([])
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: '"reply": "ok", "escalate": false}' }], usage: {} }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const history = Array.from({ length: 40 }, (_, i) => ({ author_type: 'visitor', body: `m${i}` }))
    await answerSupportQuestion(history, 'latest')

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    // 8 history turns + the question + the assistant prefill
    expect(body.messages).toHaveLength(10)
  })
})
