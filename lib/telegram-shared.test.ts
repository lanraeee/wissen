import { parseAdmins, parseCommand, chunkText, escapeHtml, safeEqual, isCronJob } from './telegram-shared'

describe('parseAdmins', () => {
  it('parses id:email pairs and lowercases emails', () => {
    const map = parseAdmins(' 123:Admin@WissenHaus.org , 456:b@x.com')
    expect(map.get(123)).toBe('admin@wissenhaus.org')
    expect(map.get(456)).toBe('b@x.com')
  })

  it('skips malformed entries instead of failing the list', () => {
    const map = parseAdmins('abc:a@x.com,789:not-an-email,-5:c@x.com,,321:ok@x.com')
    expect([...map.keys()]).toEqual([321])
  })

  it('treats empty and missing as no admins', () => {
    expect(parseAdmins('').size).toBe(0)
    expect(parseAdmins(undefined).size).toBe(0)
  })
})

describe('parseCommand', () => {
  it('splits command and arguments', () => {
    expect(parseCommand('/run knowledge')).toEqual({ command: 'run', args: 'knowledge' })
    expect(parseCommand('/ASK how many\nusers?')).toEqual({ command: 'ask', args: 'how many\nusers?' })
  })

  it('accepts a command addressed to this bot and ignores one for another bot', () => {
    expect(parseCommand('/stats@WissenBot', 'wissenbot')).toEqual({ command: 'stats', args: '' })
    expect(parseCommand('/stats@OtherBot', 'wissenbot')).toBeNull()
  })

  it('returns null for plain text', () => {
    expect(parseCommand('hello')).toBeNull()
    expect(parseCommand(undefined)).toBeNull()
  })
})

describe('chunkText', () => {
  it('leaves short text alone', () => {
    expect(chunkText('hi', 10)).toEqual(['hi'])
  })

  it('splits on line breaks and keeps every character', () => {
    const text = 'aaaa\nbbbb\ncccc'
    const parts = chunkText(text, 6)
    expect(parts.every(p => p.length <= 6)).toBe(true)
    expect(parts.join('\n')).toBe(text)
  })

  it('hard-splits a single long word', () => {
    expect(chunkText('x'.repeat(25), 10)).toEqual(['x'.repeat(10), 'x'.repeat(10), 'x'.repeat(5)])
  })
})

describe('helpers', () => {
  it('escapes HTML', () => {
    expect(escapeHtml('<b>&"')).toBe('&lt;b&gt;&amp;"')
  })

  it('compares secrets exactly', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abd', 'abc')).toBe(false)
    expect(safeEqual('ab', 'abc')).toBe(false)
    expect(safeEqual(null, 'abc')).toBe(false)
  })

  it('knows the cron jobs', () => {
    expect(isCronJob('ledger')).toBe(true)
    expect(isCronJob('drop-tables')).toBe(false)
  })
})
