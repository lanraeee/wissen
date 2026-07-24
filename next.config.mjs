/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/bootcamp',
        destination: '/career-clarity-trade-fair',
        permanent: true,
      },
    ]
  },
}
export default nextConfig
