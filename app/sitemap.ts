import type { MetadataRoute } from 'next'
import sql from '@/lib/db'
import { getCourses } from '@/lib/courses'

const BASE = 'https://www.wissenhaus.org'

// Best-effort: a failed query drops that section of the sitemap rather than
// failing the whole thing (Google will just see fewer URLs until the next
// crawl of /sitemap.xml, not an error page).
async function safe<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn()
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about/story`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/founder`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/team`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/impact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/safeguarding`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/transparency/ledger`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/transparency/costs`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // /support only. Individual ticket threads are private to whoever holds
    // the reference and carry robots: noindex.
    { url: `${BASE}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/programmes`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/career-clarity-fair`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/opportunity-blueprint`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/impact-content`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // The Opportunity Hub's listings live here now, refreshed daily by the
    // opportunities cron, so /community is crawled daily rather than weekly --
    // it absorbed the four type pages that used to carry that frequency.
    //
    // Each tab is listed separately because each is a distinct set of listings
    // with its own title, description and canonical (see the page's
    // generateMetadata). Without these, the merge would have handed Google one
    // page where it previously indexed four. `?tab=all` is omitted: it
    // canonicalises to the bare /community above.
    { url: `${BASE}/community`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/community?tab=scholarships`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/community?tab=jobs`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/community?tab=internships`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/community?tab=competitions`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/community?tab=wissenhaus-partners`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/careers`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/career-pathways`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/career-assessment`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/policy-research`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/volunteer`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/partner`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/partners/datacamp`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/partners/datacamp/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/donate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/courses`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/wiki`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const [courses, campaigns, threads] = await Promise.all([
    safe(async () => await getCourses()),
    safe(async () => (await sql`SELECT slug, updated_at FROM donation_projects WHERE status = 'published'`) as { slug: string; updated_at: string | null }[]),
    safe(async () => (await sql`SELECT id, created_at FROM forum_threads`) as { id: string; created_at: string }[]),
  ])

  const courseRoutes: MetadataRoute.Sitemap = courses.map(c => ({
    url: `${BASE}/courses/${c.id}`, lastModified: now, changeFrequency: 'monthly', priority: 0.7,
  }))

  const campaignRoutes: MetadataRoute.Sitemap = campaigns.map(c => ({
    url: `${BASE}/donate/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: 'weekly', priority: 0.7,
  }))

  const threadRoutes: MetadataRoute.Sitemap = threads.map(t => ({
    url: `${BASE}/community/threads/${t.id}`,
    lastModified: new Date(t.created_at),
    changeFrequency: 'monthly', priority: 0.5,
  }))

  return [...staticRoutes, ...courseRoutes, ...campaignRoutes, ...threadRoutes]
}
