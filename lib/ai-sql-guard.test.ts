import { checkReadOnlySql, redactRows, MAX_ROWS, MAX_CELL_CHARS } from './ai-sql-guard'

const ok = (sql: string) => checkReadOnlySql(sql).ok
const why = (sql: string) => {
  const r = checkReadOnlySql(sql)
  return r.ok ? null : r.reason
}

describe('checkReadOnlySql', () => {
  it('refuses any query touching the safeguarding tables, however the name is spelled', () => {
    for (const q of [
      'SELECT * FROM cio_safeguarding_incidents',
      'SELECT * FROM "cio_safeguarding_incidents"',
      'SELECT email FROM CIO_SAFEGUARDING_TEAM',
      'SELECT * FROM U&"cio_s\\0061feguarding_incidents"',
    ]) {
      expect(checkReadOnlySql(q).ok).toBe(false)
    }
  })

  it('allows a plain SELECT and a CTE', () => {
    expect(ok('SELECT id FROM users')).toBe(true)
    expect(ok('WITH x AS (SELECT 1) SELECT * FROM x')).toBe(true)
  })

  it.each([
    ['DELETE FROM users'],
    ['UPDATE users SET role = $$admin$$'],
    ['INSERT INTO users (email) VALUES ($$a@b.c$$)'],
    ['DROP TABLE support_tickets'],
    ['TRUNCATE page_views'],
    ['ALTER TABLE users ADD COLUMN x INT'],
    ['GRANT ALL ON users TO public'],
  ])('refuses %s', sql => {
    expect(ok(sql)).toBe(false)
  })

  // The attack that matters most: a legitimate-looking query with a second
  // statement riding behind it.
  it('refuses a second statement smuggled behind a valid one', () => {
    expect(ok('SELECT 1; DROP TABLE users')).toBe(false)
    expect(why('SELECT 1; DROP TABLE users')).toMatch(/single statement/i)
  })

  // ...but a semicolon inside a string is not a statement separator, and
  // refusing those would block legitimate questions about message content.
  it('allows a semicolon inside a string literal', () => {
    expect(ok("SELECT * FROM ticket_messages WHERE body = 'hi; there'")).toBe(true)
  })

  // Keyword scanning runs on comment- and string-stripped SQL, so neither can
  // be used to hide a write or to fake one.
  it('is not fooled by a write keyword inside a string or comment', () => {
    expect(ok("SELECT * FROM ticket_messages WHERE body = 'please delete everything'")).toBe(true)
    expect(ok('SELECT 1 -- drop table users')).toBe(true)
  })

  it('does not trip on column names that merely contain a keyword', () => {
    expect(ok('SELECT updated_at, created_at FROM support_tickets')).toBe(true)
    expect(ok('SELECT selected_option FROM scholarship_applications')).toBe(true)
  })

  it('refuses SELECT ... INTO, which writes a table', () => {
    expect(ok('SELECT * INTO copy_of_users FROM users')).toBe(false)
  })

  it('refuses filesystem and network reach-outs', () => {
    expect(ok("SELECT pg_read_file('/etc/passwd')")).toBe(false)
    expect(ok("SELECT dblink('host=evil.com', 'SELECT 1')")).toBe(false)
    expect(ok('SELECT pg_sleep(60)')).toBe(false)
  })

  it('refuses credential catalog reads', () => {
    expect(ok('SELECT * FROM pg_authid')).toBe(false)
    expect(ok('SELECT * FROM pg_catalog.pg_user')).toBe(false)
  })

  it('refuses session tampering', () => {
    expect(ok('SET ROLE postgres')).toBe(false)
    expect(ok("SELECT set_config('role','postgres',false)")).toBe(false)
  })

  it('appends a LIMIT when the query has none, and leaves an existing one alone', () => {
    const added = checkReadOnlySql('SELECT * FROM page_views')
    expect(added.ok && added.sql).toContain(`LIMIT ${MAX_ROWS}`)
    const kept = checkReadOnlySql('SELECT * FROM page_views LIMIT 5')
    expect(kept.ok && kept.sql).toBe('SELECT * FROM page_views LIMIT 5')
  })

  it('refuses an empty or oversized query', () => {
    expect(ok('   ')).toBe(false)
    expect(ok('SELECT ' + 'a'.repeat(5000))).toBe(false)
  })
})

describe('redactRows', () => {
  // Even read-only, a password hash must never leave the database. Redaction
  // is on the output because a column can arrive via SELECT *, a join or an
  // alias, and blocking every spelling in the query is a losing game.
  it('redacts credential-shaped columns however they arrive', () => {
    const [row] = redactRows([{ id: '1', email: 'a@b.c', password_hash: '$2a$12$abc' }])
    expect(row.password_hash).toBe('[redacted]')
    expect(row.email).toBe('a@b.c')
  })

  it('redacts session and token columns', () => {
    const [row] = redactRows([{ session_id: 'abc', reset_token: 'xyz', api_key: 'k' }])
    expect(Object.values(row)).toEqual(['[redacted]', '[redacted]', '[redacted]'])
  })

  it('redacts binary columns', () => {
    const [row] = redactRows([{ id: '1', bytes: Buffer.from('binary') }])
    expect(row.bytes).toBe('[redacted]')
  })

  // site_content is key/value, so the sensitive part is named by a sibling
  // column rather than by this column's own name.
  it('redacts bank transfer details by their site_content key', () => {
    const [bank] = redactRows([{ key: 'bank_transfer_details', value: { accountNumber: '123' } }])
    expect(bank.value).toBe('[redacted]')
    const [safe] = redactRows([{ key: 'page_copy_about', value: { heading: 'About' } }])
    expect(safe.value).toContain('About')
  })

  it('truncates oversized cells so one row cannot eat the context window', () => {
    const [row] = redactRows([{ bio: 'x'.repeat(MAX_CELL_CHARS + 500) }])
    expect(String(row.bio).length).toBeLessThan(MAX_CELL_CHARS + 60)
    expect(String(row.bio)).toContain('truncated')
  })

  it('caps the number of rows regardless of what came back', () => {
    const many = Array.from({ length: MAX_ROWS + 50 }, (_, i) => ({ i }))
    expect(redactRows(many)).toHaveLength(MAX_ROWS)
  })

  it('leaves nulls alone', () => {
    const [row] = redactRows([{ a: null, b: undefined }])
    expect(row.a).toBeNull()
    expect(row.b).toBeUndefined()
  })
})
