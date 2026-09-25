# 001 — Neon serverless Postgres as the database

## Context
The app runs on Vercel's serverless/edge functions, which need a database driver that works over HTTP rather than a persistent TCP connection pool (a traditional `pg` connection would exhaust connections across many short-lived serverless invocations).

## Decision
Use Neon (serverless Postgres) via `@neondatabase/serverless`, accessed through a single lazily-initialized tagged-template client (`lib/db.ts`). Every query is a plain tagged template: `` sql`SELECT ... WHERE id = ${id}` ``, which parameterizes automatically (no manual escaping, no SQL injection surface from string interpolation).

`lib/db.ts` wraps the client in a `Proxy` so the connection is created on first query, not at import time — this specifically avoids Next.js build failures when `WISSENDB_DATABASE_URL` is absent during static analysis/build.

## Consequences
- No connection pooling to manage ourselves; Neon handles it.
- Every DB access site in the codebase is a plain `sql\`...\`` call — no ORM, no query builder, no migration framework. Schema changes are tracked by hand in `lib/schema.sql`.
- This also means no compile-time query type-checking — a typo in a column name fails at runtime, not build time.
