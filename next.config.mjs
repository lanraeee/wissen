import { withSentryConfig } from '@sentry/nextjs/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://eu-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/bootcamp',
        destination: '/career-clarity-fair',
        permanent: true,
      },
      {
        source: '/career-clarity-trade-fair/:path*',
        destination: '/career-clarity-fair/:path*',
        permanent: true,
      },
      {
        source: '/podcast',
        destination: '/opportunity-blueprint',
        permanent: true,
      },
      // The Opportunity Hub's four type pages are now tabs on /community.
      // These 301s keep every indexed URL, inbound link and shared card
      // working, and land each one on the tab it used to be.
      //
      // The partner-scholarship rule MUST stay above the bare /scholarships
      // rule: Next matches redirects in order, and the general one would
      // otherwise swallow the query and drop people on the wrong tab.
      {
        source: '/scholarships',
        has: [{ type: 'query', key: 'tab', value: 'wissenhaus-partners' }],
        destination: '/community?tab=wissenhaus-partners',
        permanent: true,
      },
      {
        source: '/scholarships',
        destination: '/community?tab=scholarships',
        permanent: true,
      },
      {
        source: '/jobs',
        destination: '/community?tab=jobs',
        permanent: true,
      },
      {
        source: '/internships',
        destination: '/community?tab=internships',
        permanent: true,
      },
      {
        source: '/competitions',
        destination: '/community?tab=competitions',
        permanent: true,
      },
    ]
  },
}

// withSentryConfig is safe to apply even without a DSN configured -- it only
// adds build-time source-map upload and a request-tracing wrapper, both of
// which are no-ops without SENTRY_AUTH_TOKEN / SENTRY_DSN set. Source-map
// upload during `next build` is additionally skipped whenever CI is unset,
// so local/dev builds are unaffected either way.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  disableLogger: true,
})
