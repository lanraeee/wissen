import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/profile', '/login', '/verify/'],
      },
    ],
    sitemap: 'https://www.wissenhaus.org/sitemap.xml',
  }
}
