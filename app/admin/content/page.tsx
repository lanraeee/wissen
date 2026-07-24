import type { Metadata } from 'next'
import CareersEditor from '@/components/admin/CareersEditor'
import PolicyEditor from '@/components/admin/PolicyEditor'

export const metadata: Metadata = { title: 'Content · Admin · Wissen-Haus' }

export default function AdminContent({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return <AdminContentInner searchParamsPromise={searchParams} />
}

async function AdminContentInner({ searchParamsPromise }: { searchParamsPromise: Promise<{ tab?: string }> }) {
  const { tab = 'careers' } = await searchParamsPromise

  const tabs = [
    { key: 'careers', label: 'Careers Roles' },
    { key: 'policy', label: 'Policy Timeline' },
  ]

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Content Editor</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Edit page content that is displayed publicly on the site.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {tabs.map(t => (
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
      </div>
    </>
  )
}
