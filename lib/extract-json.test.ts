vi.mock('@/lib/db', () => ({ default: vi.fn() }))
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }))

import { extractJson } from './support-agent'

// The agent used to force JSON with an assistant prefill of '{'. That is a
// model capability, not a contract: claude-sonnet-5 started rejecting it
// outright ("this model does not support assistant message prefill") and took
// the agent down. Tolerating a wrapper costs nothing and cannot be withdrawn.
describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"reply":"hello","escalate":false}'))
      .toEqual({ reply: 'hello', escalate: false })
  })

  it('parses JSON wrapped in a fenced code block', () => {
    expect(extractJson('```json\n{"reply":"hi","escalate":true}\n```'))
      .toEqual({ reply: 'hi', escalate: true })
  })

  it('parses JSON preceded by a prose preamble', () => {
    expect(extractJson('Here is my response:\n\n{"reply":"hi","escalate":false}'))
      .toEqual({ reply: 'hi', escalate: false })
  })

  it('parses JSON followed by trailing prose', () => {
    expect(extractJson('{"reply":"hi","escalate":false}\n\nLet me know if that helps.'))
      .toEqual({ reply: 'hi', escalate: false })
  })

  // A reply containing braces must not truncate the object -- lastIndexOf
  // rather than the first closing brace is what makes this work.
  it('handles braces inside the reply text', () => {
    const out = extractJson('{"reply":"Use the {name} placeholder","escalate":false}')
    expect(out?.reply).toBe('Use the {name} placeholder')
  })

  it('returns null rather than throwing on unparseable text', () => {
    expect(extractJson('I cannot help with that.')).toBeNull()
    expect(extractJson('{not valid json')).toBeNull()
    expect(extractJson('')).toBeNull()
  })
})
