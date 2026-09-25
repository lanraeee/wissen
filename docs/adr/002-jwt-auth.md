# 002 — JWT + httpOnly cookie auth, no server-side session store

## Context
Need authentication that works identically in Node.js API routes and Edge Middleware (which can't use most Node APIs or hit a connection-pooled database on every request cheaply).

## Decision
Sign a JWT (`jose`, HS256) containing `{ id, email, name, role?, membershipExpiry? }` on login/signup, store it in an `httpOnly`, `sameSite: lax`, `secure`-in-production cookie (`wh_token`), 30-day expiry. `lib/auth.ts` (Node runtime: password hashing via bcryptjs, full session read) and `lib/auth-edge.ts` (Edge runtime: verification only) both verify the same token via `jwtSecret()`, which throws rather than silently encoding the string `"undefined"` as a key if `JWT_SECRET` is missing.

`middleware.ts` verifies the token's signature (not just its presence) before allowing access to protected routes, so a forged or expired cookie never reaches a protected page — role-specific checks (`adminGuard`, `directorGuard`, `isDirector`) still happen server-side per route.

## Consequences
- No session table, no server-side revocation — a stolen token is valid until it expires (30 days) or the secret rotates. There is no "log out everywhere" mechanism.
- Role changes don't take effect until the user's token is reissued (next login), since role is baked into the JWT payload.
- Verification is cheap (no DB round-trip) and works identically in Edge Middleware and Node route handlers.
