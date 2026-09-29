import { parseExpectedSchema, diffSchema, hasDrift, describeDrift } from './schema-check'

const SAMPLE = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A commented-out migration must not be treated as a real column.
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ghost TEXT;

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(12,2) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('Stripe','Bank Transfer')),
  status TEXT NOT NULL DEFAULT 'pending'
           CHECK (status IN ('pending','confirmed')),
  UNIQUE(id, amount)
);

CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount);

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
`

describe('parseExpectedSchema', () => {
  const parsed = parseExpectedSchema(SAMPLE)

  it('reads every declared table', () => {
    expect([...parsed.keys()].sort()).toEqual(['donations', 'page_views', 'users'])
  })

  it('reads a table’s columns', () => {
    expect([...parsed.get('users')!].sort()).toEqual(['created_at', 'email', 'id', 'role'])
  })

  it('does not mistake table constraints for columns', () => {
    const donations = parsed.get('donations')!
    expect([...donations].sort()).toEqual(['amount', 'id', 'provider', 'status'])
    expect(donations.has('unique')).toBe(false)
    expect(donations.has('check')).toBe(false)
  })

  it('picks up columns added by ALTER TABLE', () => {
    expect([...parsed.get('page_views')!]).toEqual(['user_id'])
  })

  it('ignores commented-out statements', () => {
    expect(parsed.get('users')!.has('ghost')).toBe(false)
  })
})

describe('diffSchema', () => {
  const expected = new Map([
    ['users', new Set(['id', 'email'])],
    ['page_views', new Set(['id', 'user_id'])],
  ])

  it('reports no drift when the database matches', () => {
    const actual = new Map([
      ['users', new Set(['id', 'email'])],
      ['page_views', new Set(['id', 'user_id'])],
    ])
    const drift = diffSchema(expected, actual)
    expect(hasDrift(drift)).toBe(false)
  })

  // The real Sep 2026 outage: code shipped writing page_views.user_id while
  // the database had no such column, and every insert failed unnoticed.
  it('catches a column the code writes but the database lacks', () => {
    const actual = new Map([
      ['users', new Set(['id', 'email'])],
      ['page_views', new Set(['id'])],
    ])
    const drift = diffSchema(expected, actual)
    expect(hasDrift(drift)).toBe(true)
    expect(drift.missingColumns).toEqual([{ table: 'page_views', column: 'user_id' }])
    expect(describeDrift(drift)).toContain('page_views.user_id')
  })

  it('catches an entire table that was never created', () => {
    const drift = diffSchema(expected, new Map([['users', new Set(['id', 'email'])]]))
    expect(drift.missingTables).toEqual(['page_views'])
    expect(describeDrift(drift)).toContain('page_views')
  })

  it('ignores tables and columns the database has but schema.sql does not declare', () => {
    const actual = new Map([
      ['users', new Set(['id', 'email', 'legacy_field'])],
      ['page_views', new Set(['id', 'user_id'])],
      ['old_table', new Set(['id'])],
    ])
    expect(hasDrift(diffSchema(expected, actual))).toBe(false)
  })
})
