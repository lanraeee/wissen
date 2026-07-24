import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _client: NeonQueryFunction<false, false> | undefined

function client(): NeonQueryFunction<false, false> {
  if (!_client) {
    const url = process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
    if (!url) throw new Error('Missing WISSENDB_DATABASE_URL env var')
    _client = neon(url)
  }
  return _client
}

// Proxy with a function as target so the 'apply' trap fires on tagged-template calls.
// Lazy init: DB connection is created on first query, not at import time,
// which prevents Next.js build failures when the env var is absent during static analysis.
const sql = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_t, _ctx, args) {
      return (client() as unknown as (...a: unknown[]) => unknown)(...args)
    },
    get(_t, prop) {
      return (client() as unknown as Record<string | symbol, unknown>)[prop]
    },
  }
) as NeonQueryFunction<false, false>

export default sql
