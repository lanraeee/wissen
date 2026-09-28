import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import OpportunityGrid from '@/components/OpportunityGrid'
import PartnerScholarshipsGrid from '@/components/PartnerScholarshipsGrid'
import StreakBadge from '@/components/StreakBadge'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import { getSiteContent } from '@/lib/site-content'
import type { PartnerScholarship } from '@/lib/partner-scholarships'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('scholarships')!))
}

const TABS = [
  { key: 'all', label: 'All Scholarships' },
  { key: 'wissenhaus-partners', label: 'Wissen-Haus Partners' },
] as const

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams
  const tab = rawTab === 'wissenhaus-partners' ? 'wissenhaus-partners' : 'all'
  const partnerScholarships = tab === 'wissenhaus-partners'
    ? (await getSiteContent<PartnerScholarship[]>('partner_scholarships')) ?? []
    : []

  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <span className="eyebrow reveal">Community Hub · Scholarships</span>
          <h1 className="display-lg mt-s reveal">Scholarships</h1>
          <p className="lead mt-s reveal" data-d="1">Scholarship opportunities for Nigerian, African, and diaspora students — from undergrad funding to international grants, plus free access through Wissen-Haus&apos;s own partnerships.</p>

          <div className="pillrow mt-l reveal" data-d="2">
            {TABS.map(t => (
              <Link key={t.key} href={`/scholarships?tab=${t.key}`} className={`p${tab === t.key ? ' active' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>

          <div className="mt-l">
            {tab === 'wissenhaus-partners' ? (
              <PartnerScholarshipsGrid partners={partnerScholarships} />
            ) : (
              <OpportunityGrid type="scholarship" showFilter={true} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
