/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
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
