import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { isDirector, canAccessSafeguarding } from '@/lib/admin-guard'
import TrusteeRegisterEditor from '@/components/admin/TrusteeRegisterEditor'
import RegistrationsTab from '@/components/admin/cio/RegistrationsTab'
import MeetingsTab from '@/components/admin/cio/MeetingsTab'
import PoliciesTab from '@/components/admin/cio/PoliciesTab'
import FilingsTab from '@/components/admin/cio/FilingsTab'
import ConstitutionTab from '@/components/admin/cio/ConstitutionTab'
import ConflictsTab from '@/components/admin/cio/ConflictsTab'
import DocumentsTab from '@/components/admin/cio/DocumentsTab'
import LedgerTab from '@/components/admin/cio/LedgerTab'
import FixedCostsTab from '@/components/admin/cio/FixedCostsTab'
import SafeguardingTab from '@/components/admin/cio/SafeguardingTab'

export const metadata: Metadata = { title: 'WHF-CIO Records · Admin · Wissen-Haus' }

const TABS = [
  { key: 'trustees', label: 'Trustees' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'meetings', label: 'Meetings & Minutes' },
  { key: 'conflicts', label: 'Conflicts of Interest' },
  { key: 'policies', label: 'Policies' },
  { key: 'filings', label: 'Filings & Compliance' },
  { key: 'documents', label: 'Documents' },
  { key: 'ledger', label: 'Financial Ledger' },
  { key: 'costs', label: 'Operational Fixed Costs' },
  { key: 'safeguarding', label: 'Safeguarding' },
] as const

type TabKey = (typeof TABS)[number]['key']

// The designated safeguarding team (lib/safeguarding.ts) sees this tab and
// nothing else in WHF-CIO Records. Directors see every tab.
const SAFEGUARDING_TABS: readonly TabKey[] = ['safeguarding']

const CONTENT: Record<TabKey, React.ReactNode> = {
  trustees: <TrusteeRegisterEditor />,
  constitution: <ConstitutionTab />,
  registrations: <RegistrationsTab />,
  meetings: <MeetingsTab />,
  conflicts: <ConflictsTab />,
  policies: <PoliciesTab />,
  filings: <FilingsTab />,
  documents: <DocumentsTab />,
  ledger: <LedgerTab />,
  costs: <FixedCostsTab />,
  safeguarding: null, // rendered below: it needs to know whether the viewer is a director
}

export default async function WhfCioPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession()
  const director = isDirector(session?.email)
  if (!session || (!director && !await canAccessSafeguarding(session.email))) redirect('/admin')

  const tabs = director ? TABS : TABS.filter(t => SAFEGUARDING_TABS.includes(t.key))
  const { tab = tabs[0].key } = await searchParams
  const active = tabs.find(t => t.key === tab) ?? tabs[0]

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">WHF-CIO Records</h1>
        <p className="admin-page-desc">
          {director
            ? 'CIO Trustee governance record for Wissen-Haus Empowerment Foundation. Only directors can view and manage trustee information required by the Charity Commission.'
            : 'Safeguarding incident log for Wissen-Haus Empowerment Foundation. Visible only to directors and the designated safeguarding team.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <a key={t.key} href={`/admin/whf-cio?tab=${t.key}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: active.key === t.key ? '#1a3c2e' : '#fff',
            color: active.key === t.key ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
          }}>{t.label}</a>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        {active.key === 'safeguarding' ? <SafeguardingTab isDirector={director} /> : CONTENT[active.key]}
      </div>
    </>
  )
}
