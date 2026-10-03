import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { directorGuard } from '@/lib/admin-guard'
import TrusteeRegisterEditor from '@/components/admin/TrusteeRegisterEditor'
import RegistrationsTab from '@/components/admin/cio/RegistrationsTab'

export const metadata: Metadata = { title: 'WHEF-CIO Records · Admin · Wissen-Haus' }

const TABS = [
  { key: 'trustees', label: 'Trustees' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'meetings', label: 'Meetings & Minutes' },
  { key: 'conflicts', label: 'Conflicts of Interest' },
  { key: 'policies', label: 'Policies' },
  { key: 'filings', label: 'Filings & Compliance' },
  { key: 'documents', label: 'Documents' },
] as const

export default async function WhefCioPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await directorGuard()
  if (!session) redirect('/admin')

  const { tab = 'trustees' } = await searchParams
  const active = TABS.find(t => t.key === tab) ?? TABS[0]

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">WHEF-CIO Records</h1>
        <p className="admin-page-desc">
          CIO Trustee governance record for Wissen-Haus Empowerment Foundation.
          Only directors can view and manage trustee information required by the Charity Commission.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <a key={t.key} href={`/admin/whef-cio?tab=${t.key}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: active.key === t.key ? '#1a3c2e' : '#fff',
            color: active.key === t.key ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
          }}>{t.label}</a>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        {active.key === 'trustees' ? (
          <TrusteeRegisterEditor />
        ) : active.key === 'registrations' ? (
          <RegistrationsTab />
        ) : (
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.9rem' }}>
            {active.label} is not built yet.
          </p>
        )}
      </div>
    </>
  )
}
