/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
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
        destination: '/career-clarity-trade-fair',
        permanent: true,
      },
      {
        source: '/podcast',
        destination: '/opportunity-blueprint',
        permanent: true,
      },
    ]
  },
}
export default nextConfig
