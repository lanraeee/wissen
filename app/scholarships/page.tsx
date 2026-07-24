import type { Metadata } from 'next'
import OpportunityGrid from '@/components/OpportunityGrid'
import StreakBadge from '@/components/StreakBadge'

export const metadata: Metadata = {
  title: 'Scholarships · Wissen-Haus Community',
  description: 'Scholarships for Nigerian and African students.',
}

export default function ScholarshipsPage() {
  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <span className="eyebrow reveal">Community Hub · Scholarships</span>
          <h1 className="display-lg mt-s reveal">Scholarships</h1>
          <p className="lead mt-s reveal" data-d="1">Scholarship opportunities for Nigerian and African students — from undergrad funding to international grants.</p>
          <div className="mt-l">
            <OpportunityGrid type="scholarship" showFilter={true} />
          </div>
        </div>
      </section>
    </>
  )
}
