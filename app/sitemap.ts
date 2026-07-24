import type { MetadataRoute } from 'next'

const BASE = 'https://www.wissenhaus.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/about/story`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/founder`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/programmes`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/career-clarity-trade-fair`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/podcast`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/impact-content`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/community`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/careers`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/career-pathways`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/career-assessment`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/policy-research`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/volunteer`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/partner`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/donate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/jobs`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/internships`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/scholarships`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/competitions`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  return staticRoutes
}
