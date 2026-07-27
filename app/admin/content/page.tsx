import type { Metadata } from 'next'
import CareersEditor from '@/components/admin/CareersEditor'
import PolicyEditor from '@/components/admin/PolicyEditor'
import FounderEditor from '@/components/admin/FounderEditor'
import ThreadsEditor from '@/components/admin/ThreadsEditor'
import TeamEditor from '@/components/admin/TeamEditor'
import DonationCertEditor from '@/components/admin/DonationCertEditor'
import FoundationDetailsEditor from '@/components/admin/FoundationDetailsEditor'
import ImpactStoriesEditor from '@/components/admin/ImpactStoriesEditor'

export const metadata: Metadata = { title: 'Content · Admin · Wissen-Haus' }

const TABS = [
  { key: 'careers', label: 'Careers Roles' },
  { key: 'impact', label: 'Impact Stories' },
  { key: 'policy', label: 'Policy Timeline' },
  { key: 'team', label: 'Team Members' },
  { key: 'founder', label: 'Founder Bio' },
  { key: 'threads', label: 'Community Threads' },
  { key: 'donation-certs', label: '🧾 Donation Receipts' },
  { key: 'foundation', label: 'Foundation Details' },
]

export default async function AdminContent({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'careers' } = await searchParams

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Content Editor</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Edit page content displayed publicly on the site. Changes take effect on the next page load.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <a key={t.key} href={`/admin/content?tab=${t.key}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: tab === t.key ? '#1a3c2e' : '#fff',
            color: tab === t.key ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
          }}>{t.label}</a>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        {tab === 'careers' && <CareersEditor />}
        {tab === 'impact' && <ImpactStoriesEditor />}
        {tab === 'policy' && <PolicyEditor />}
        {tab === 'team' && <TeamEditor />}
        {tab === 'founder' && <FounderEditor />}
        {tab === 'threads' && <ThreadsEditor />}
        {tab === 'donation-certs' && <DonationCertEditor />}
        {tab === 'foundation' && <FoundationDetailsEditor />}
      </div>
    </>
  )
}
