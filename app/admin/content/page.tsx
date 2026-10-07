import type { Metadata } from 'next'
import { adminRole } from '@/lib/admin-guard'
import ApprovalNotice from '@/components/admin/ApprovalNotice'
import CareersEditor from '@/components/admin/CareersEditor'
import CoursesEditor from '@/components/admin/CoursesEditor'
import HomeContentEditor from '@/components/admin/HomeContentEditor'
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
import PageCopyEditor from '@/components/admin/PageCopyEditor'
import PartnerScholarshipsEditor from '@/components/admin/PartnerScholarshipsEditor'
import ContactDetailsEditor from '@/components/admin/ContactDetailsEditor'
import DonationProcessorEditor from '@/components/admin/DonationProcessorEditor'

export const metadata: Metadata = { title: 'Content · Admin · Wissen-Haus' }

const TABS = [
  { key: 'contact', label: '📞 Contact Details' },
  { key: 'page-copy', label: '✏️ Page Copy' },
  { key: 'homepage', label: 'Homepage Hero' },
  { key: 'careers', label: 'Careers Roles' },
  { key: 'courses', label: 'Courses' },
  { key: 'policy', label: 'Policy Timeline' },
  { key: 'team', label: 'Team Members' },
  { key: 'partners', label: 'Partners' },
  { key: 'partner-scholarships', label: '🎓 Partner Scholarships' },
  { key: 'founder', label: 'Founder Bio' },
  { key: 'threads', label: 'Community Threads' },
  { key: 'whatsapp', label: 'WhatsApp Channel' },
  { key: 'impact-stories', label: 'Impact Stories' },
  { key: 'donation-certs', label: '🧾 Donation Receipts' },
  { key: 'bank-details', label: '🏦 Bank Transfer Details', directorOnly: true },
  { key: 'donation-processor', label: '💳 Donation Processor' },
  { key: 'foundation', label: 'Foundation Details' },
]

export default async function AdminContent({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'careers' } = await searchParams
  // bank_transfer_details is director-only at the API (DIRECTOR_ONLY_KEYS in
  // app/api/admin/content/[key]/route.ts). Without this the tab rendered for
  // editors too: the form loaded empty on a 403, they could type a full bank
  // account into it, and the save was rejected -- silent failure on the one
  // field that decides where donations land.
  const role = await adminRole()
  const isDirector = role === 'director'
  const needsApproval = role === 'editor'
  const tabs = TABS.filter(t => !t.directorOnly || isDirector)
  const activeTab = tabs.some(t => t.key === tab) ? tab : 'careers'

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Content Editor</h1>
        <p className="admin-page-desc">Edit page content displayed publicly on the site. Changes take effect on the next page load.</p>
      </div>

      {needsApproval && <ApprovalNotice />}

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <a key={t.key} href={`/admin/content?tab=${t.key}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: activeTab === t.key ? '#1a3c2e' : '#fff',
            color: activeTab === t.key ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
          }}>{t.label}</a>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        {activeTab === 'contact' && <ContactDetailsEditor />}
        {activeTab === 'page-copy' && <PageCopyEditor />}
        {activeTab === 'homepage' && <HomeContentEditor />}
        {activeTab === 'careers' && <CareersEditor />}
        {activeTab === 'courses' && <CoursesEditor />}
        {activeTab === 'policy' && <PolicyEditor />}
        {activeTab === 'team' && <TeamEditor />}
        {activeTab === 'partners' && <PartnersEditor />}
        {activeTab === 'partner-scholarships' && <PartnerScholarshipsEditor />}
        {activeTab === 'founder' && <FounderEditor />}
        {activeTab === 'threads' && <ThreadsEditor />}
        {activeTab === 'whatsapp' && <WhatsAppEditor />}
        {activeTab === 'impact-stories' && <ImpactStoriesEditor />}
        {activeTab === 'donation-certs' && <DonationCertEditor />}
        {activeTab === 'bank-details' && isDirector && <BankDetailsEditor />}
        {activeTab === 'donation-processor' && <DonationProcessorEditor />}
        {activeTab === 'foundation' && <FoundationDetailsEditor />}
      </div>
    </>
  )
}
