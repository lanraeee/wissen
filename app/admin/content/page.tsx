import type { Metadata } from 'next'
import CareersEditor from '@/components/admin/CareersEditor'
import PolicyEditor from '@/components/admin/PolicyEditor'
import FounderEditor from '@/components/admin/FounderEditor'
import ThreadsEditor from '@/components/admin/ThreadsEditor'
import TeamEditor from '@/components/admin/TeamEditor'
import PartnersEditor from '@/components/admin/PartnersEditor'
import DonationCertEditor from '@/components/admin/DonationCertEditor'
import FoundationDetailsEditor from '@/components/admin/FoundationDetailsEditor'
import ImpactStoriesEditor from '@/components/admin/ImpactStoriesEditor'
import WhatsAppEditor from '@/components/admin/WhatsAppEditor'
import BankDetailsEditor from '@/components/admin/BankDetailsEditor'

export const metadata: Metadata = { title: 'Content · Admin · Wissen-Haus' }

const TABS = [
  { key: 'careers', label: 'Careers Roles' },
  { key: 'policy', label: 'Policy Timeline' },
  { key: 'team', label: 'Team Members' },
  { key: 'partners', label: 'Partners' },
  { key: 'founder', label: 'Founder Bio' },
  { key: 'threads', label: 'Community Threads' },
  { key: 'whatsapp', label: 'WhatsApp Channel' },
  { key: 'impact-stories', label: 'Impact Stories' },
  { key: 'donation-certs', label: '🧾 Donation Receipts' },
  { key: 'bank-details', label: '🏦 Bank Transfer Details' },
  { key: 'foundation', label: 'Foundation Details' },
]

export default async function AdminContent({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'careers' } = await searchParams

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Content Editor</h1>
        <p className="admin-page-desc">Edit page content displayed publicly on the site. Changes take effect on the next page load.</p>
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
        {tab === 'policy' && <PolicyEditor />}
        {tab === 'team' && <TeamEditor />}
        {tab === 'partners' && <PartnersEditor />}
        {tab === 'founder' && <FounderEditor />}
        {tab === 'threads' && <ThreadsEditor />}
        {tab === 'whatsapp' && <WhatsAppEditor />}
        {tab === 'impact-stories' && <ImpactStoriesEditor />}
        {tab === 'donation-certs' && <DonationCertEditor />}
        {tab === 'bank-details' && <BankDetailsEditor />}
        {tab === 'foundation' && <FoundationDetailsEditor />}
      </div>
    </>
  )
}
