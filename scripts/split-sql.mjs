// Split a .sql file into executable statements.
//
// The naive `schema.split(';')` this replaces broke twice, both times the same
// way: it split on semicolons FIRST and stripped `--` comments afterwards, so a
// semicolon inside a comment cut the statement in half and left comment prose
// standing where SQL should be. The failure is loud but the cause is not -- you
// get `syntax error at or near "this"` pointing at an English sentence.
//
// So walk the text instead and only treat `;` as a separator when it is not
// inside a line comment, a block comment, a quoted string or a quoted
// identifier. Comments are dropped as they are consumed, which also removes
// the need for the old post-hoc line filter.
export function splitSqlStatements(sql) {
  const out = []
  let buf = ''
  let i = 0

  while (i < sql.length) {
    const two = sql.slice(i, i + 2)

    if (two === '--') {
      // Line comment: skip to the newline, keeping the newline so tokens on
      // either side of a trailing comment do not run together.
      const nl = sql.indexOf('\n', i)
      if (nl === -1) break
      buf += '\n'
      i = nl + 1
      continue
    }

    if (two === '/*') {
      const end = sql.indexOf('*/', i + 2)
      i = end === -1 ? sql.length : end + 2
      buf += ' '
      continue
    }

    if (sql[i] === "'" || sql[i] === '"') {
      // Quoted string or identifier. Doubling the quote escapes it in SQL
      // ('it''s'), which falls out naturally: the closing quote ends the run
      // and the next one immediately opens a new one.
      const quote = sql[i]
      buf += quote
      i++
      while (i < sql.length) {
        buf += sql[i]
        if (sql[i] === quote) { i++; break }
        i++
      }
      continue
    }

    if (sql[i] === ';') {
      out.push(buf)
      buf = ''
      i++
      continue
    }

    buf += sql[i]
    i++
  }

  out.push(buf)
  return out.map(s => s.trim()).filter(s => s.length > 0)
}
