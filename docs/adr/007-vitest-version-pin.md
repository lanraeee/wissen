# 007 — Vitest pinned to 2.x

## Context
Setting up the test runner (`npm install -D vitest`, unpinned) resolved to vitest 5.x, which requires `@types/node ^22.0.0 || >=24.0.0`. The project pins `@types/node: ^20` (matching the Node runtime target), so npm's peer-dependency resolution failed outright.

## Decision
Install `vitest@2.1.9` explicitly (the latest 2.x release, which accepts `@types/node ^18.0.0 || >=20.0.0`), rather than bumping `@types/node` to satisfy vitest 5.

## Consequences
- `npm audit` reports vulnerabilities in vitest 2.x's bundled `vite`/`esbuild`/`@vitest/mocker` (dev-server path-traversal / arbitrary-request issues). These are **dev-only**: they affect the `vite`/`vitest` dev server, never `next build` or the deployed runtime, since vitest isn't a production dependency. Left unfixed rather than force-upgrading past the `@types/node` conflict.
- `vitest.config.mts` uses the `.mts` extension specifically (not `.ts`) because `@vitejs/plugin-react` and `vite-tsconfig-paths` are ESM-only packages and the project's `package.json` has no `"type": "module"` — a plain `.ts` config gets loaded as CommonJS and fails to `require()` them.
- Revisit this pin when either (a) the project moves to Node 22+ and can bump `@types/node`, or (b) a vitest 5.x release relaxes its `@types/node` peer range.
