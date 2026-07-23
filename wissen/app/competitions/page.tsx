import type { Metadata } from 'next'
import OpportunityGrid from '@/components/OpportunityGrid'
import StreakBadge from '@/components/StreakBadge'

export const metadata: Metadata = {
  title: 'Competitions & Hackathons · Wissen-Haus Community',
  description: 'Online competitions, hackathons, and challenges open to African youth.',
}

export default function CompetitionsPage() {
  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <span className="eyebrow reveal">Community Hub · Competitions</span>
          <h1 className="display-lg mt-s reveal">Competitions &amp; Hackathons</h1>
          <p className="lead mt-s reveal" data-d="1">Online challenges, hackathons, and competitions where you can win prizes and build your portfolio.</p>
          <div className="mt-l">
            <OpportunityGrid type="competition" showFilter={false} />
          </div>
        </div>
      </section>
    </>
  )
}
