import type { Metadata } from 'next'
import OpportunityGrid from '@/components/OpportunityGrid'
import StreakBadge from '@/components/StreakBadge'

export const metadata: Metadata = {
  title: 'Internships · Wissen-Haus Community',
  description: 'Internship opportunities open to Nigerian and African youth.',
}

export default function InternshipsPage() {
  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <span className="eyebrow reveal">Community Hub · Internships</span>
          <h1 className="display-lg mt-s reveal">Internships</h1>
          <p className="lead mt-s reveal" data-d="1">Internship opportunities from top companies, open to Nigerian and African candidates.</p>
          <div className="mt-l">
            <OpportunityGrid type="internship" showFilter={true} />
          </div>
        </div>
      </section>
    </>
  )
}
