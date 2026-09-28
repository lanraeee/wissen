import { parseCsv } from './csv'

describe('parseCsv', () => {
  it('parses a simple header + rows', () => {
    const rows = parseCsv('email,name\nada@example.com,Ada Lovelace\ngrace@example.com,Grace Hopper')
    expect(rows).toEqual([
      ['email', 'name'],
      ['ada@example.com', 'Ada Lovelace'],
      ['grace@example.com', 'Grace Hopper'],
    ])
  })

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('email,name\nada@example.com,"Lovelace, Ada"')
    expect(rows[1]).toEqual(['ada@example.com', 'Lovelace, Ada'])
  })

  it('handles escaped double quotes inside a quoted field', () => {
    const rows = parseCsv('email,name\nada@example.com,"Ada ""The Countess"" Lovelace"')
    expect(rows[1]).toEqual(['ada@example.com', 'Ada "The Countess" Lovelace'])
  })

  it('handles CRLF line endings', () => {
    const rows = parseCsv('email,name\r\nada@example.com,Ada\r\n')
    expect(rows).toEqual([['email', 'name'], ['ada@example.com', 'Ada']])
  })

  it('skips blank lines', () => {
    const rows = parseCsv('email,name\n\nada@example.com,Ada\n\n')
    expect(rows).toEqual([['email', 'name'], ['ada@example.com', 'Ada']])
  })

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })
})
