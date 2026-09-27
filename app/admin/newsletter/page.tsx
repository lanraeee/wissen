import type { Metadata } from 'next'
import SubscribersManager from '@/components/admin/newsletter/SubscribersManager'
import CampaignsManager from '@/components/admin/newsletter/CampaignsManager'
import NewsletterTemplatesManager from '@/components/admin/newsletter/NewsletterTemplatesManager'

export const metadata: Metadata = { title: 'Newsletter · Admin · Wissen-Haus' }

const TABS = [
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'templates', label: 'Templates' },
] as const

export default async function AdminNewsletter({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'subscribers' } = await searchParams

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Newsletter</h1>
        <p className="admin-page-desc">Manage newsletter subscribers, compose and send campaigns, and maintain reusable content templates.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <a key={t.key} href={`/admin/newsletter?tab=${t.key}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: tab === t.key ? '#1a3c2e' : '#fff',
            color: tab === t.key ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
          }}>{t.label}</a>
        ))}
      </div>

      {tab === 'subscribers' && <SubscribersManager />}
      {tab === 'campaigns' && <CampaignsManager />}
      {tab === 'templates' && <NewsletterTemplatesManager />}
    </>
  )
}
