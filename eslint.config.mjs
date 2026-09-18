import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

// eslint-config-next still ships in eslintrc format, so it is bridged into
// ESLint 9's flat config here. Without this file `next lint` has no config to
// find and drops into its interactive setup prompt, which fails in CI.
//
// Note that adding this file also makes `next build` enforce lint: a lint error
// now fails the production build, not just CI. That is the intent, but it means
// lint has to stay clean.
export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'docs/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]
