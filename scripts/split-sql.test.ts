import { splitSqlStatements } from './split-sql.mjs'

describe('splitSqlStatements', () => {
  it('splits plain statements', () => {
    expect(splitSqlStatements('SELECT 1; SELECT 2;')).toEqual(['SELECT 1', 'SELECT 2'])
  })

  // The bug this function exists for. A semicolon inside a `--` comment used
  // to cut the statement in half, leaving the rest of the comment standing
  // where SQL should be -- Postgres then reported `syntax error at or near
  // "this"`, pointing at an English sentence with no hint of the real cause.
  it('ignores a semicolon inside a line comment', () => {
    const sql = `
-- contact_messages stays as-is (no reply thread); this is the new store
CREATE TABLE tickets (id INT);
`
    expect(splitSqlStatements(sql)).toEqual(['CREATE TABLE tickets (id INT)'])
  })

  it('ignores a semicolon inside a block comment', () => {
    expect(splitSqlStatements('/* a; b */ SELECT 1;')).toEqual(['SELECT 1'])
  })

  it('ignores a semicolon inside a string literal', () => {
    const [stmt] = splitSqlStatements(`INSERT INTO t (c) VALUES ('a;b');`)
    expect(stmt).toBe(`INSERT INTO t (c) VALUES ('a;b')`)
  })

  it('handles a doubled quote inside a string', () => {
    const [stmt] = splitSqlStatements(`INSERT INTO t (c) VALUES ('it''s; fine');`)
    expect(stmt).toBe(`INSERT INTO t (c) VALUES ('it''s; fine')`)
  })

  it('keeps a statement that follows a multi-line comment block', () => {
    const sql = `
-- one
-- two
CREATE INDEX idx ON t(c);
`
    expect(splitSqlStatements(sql)).toEqual(['CREATE INDEX idx ON t(c)'])
  })

  it('does not run tokens together across a trailing comment', () => {
    const sql = 'CREATE TABLE t (\n  a INT, -- first\n  b INT\n);'
    const [stmt] = splitSqlStatements(sql)
    expect(stmt).toContain('a INT,')
    expect(stmt).toContain('b INT')
    expect(stmt).not.toContain('first')
  })

  it('returns nothing for a comment-only file', () => {
    expect(splitSqlStatements('-- just a note\n')).toEqual([])
  })
})
