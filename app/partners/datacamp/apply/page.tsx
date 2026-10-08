import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { getSiteContent } from '@/lib/site-content'
import ScholarshipApplicationForm from '@/components/ScholarshipApplicationForm'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('partners-datacamp-apply')!))
}

export default async function DataCampScholarshipApplyPage() {
  const settings = await getSiteContent<{ tagline?: string }>('site_settings')
  const tagline = settings?.tagline || 'Empowering Youth, Shaping Futures'

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap">
        <div className="section-head center mb-l reveal">
          <span className="eyebrow">DataCamp Scholarship Programme</span>
          <h1 className="display-lg mt-s">Are you ready to build skills that can change your career?</h1>
          <p className="lead mt-m" style={{ maxWidth: '60ch', margin: 'var(--spacing-m) auto 0' }}>
            Wissen-Haus is offering DataCamp scholarships to young people who are motivated to develop practical
            skills in data, analytics, AI, programming and related fields — but may not otherwise have access to
            premium learning resources. Designed for learners who demonstrate motivation, genuine financial/access
            barriers, commitment to learning, and a clear plan for using their skills.
          </p>
          <p className="mt-s" style={{ fontSize: '.85rem', color: 'var(--ink-60)' }}>Estimated completion time: 3–5 minutes.</p>
        </div>

        <ScholarshipApplicationForm tagline={tagline} />
      </div>
    </section>
  )
}
