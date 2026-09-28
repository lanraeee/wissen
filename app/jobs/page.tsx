import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import OpportunityGrid from '@/components/OpportunityGrid'
import StreakBadge from '@/components/StreakBadge'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('jobs')!))
}

export default function JobsPage() {
  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <span className="eyebrow reveal">Community Hub · Jobs</span>
          <h1 className="display-lg mt-s reveal">Remote Jobs</h1>
          <p className="lead mt-s reveal" data-d="1">Remote job opportunities open to Nigerian, African, and diaspora candidates, updated daily from the best sources.</p>
          <div className="mt-l">
            <OpportunityGrid type="job" showFilter={true} />
          </div>
        </div>
      </section>
    </>
  )
}
