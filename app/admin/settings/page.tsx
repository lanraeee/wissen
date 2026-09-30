import type { Metadata } from 'next'
import { adminRole } from '@/lib/admin-guard'
import ApprovalNotice from '@/components/admin/ApprovalNotice'
import SettingsEditor from '@/components/admin/SettingsEditor'
import OpenGraphEditor from '@/components/admin/OpenGraphEditor'
import AiSettingsEditor from '@/components/admin/AiSettingsEditor'

export const metadata: Metadata = { title: 'Settings · Admin · Wissen-Haus' }

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'opengraph', label: '🔗 Open Graph' },
  { key: 'ai', label: '✨ AI', directorOnly: true },
]

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'general' } = await searchParams
  const role = await adminRole()
  const needsApproval = role === 'editor'
  const tabs = TABS.filter(t => !t.directorOnly || role === 'director')
  const activeTab = tabs.some(t => t.key === tab) ? tab : 'general'

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-desc">Global site configuration — contact details, social links, display settings, and how pages look when shared.</p>
      </div>

      {needsApproval && <ApprovalNotice />}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <a key={t.key} href={`/admin/settings?tab=${t.key}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: activeTab === t.key ? '#1a3c2e' : '#fff',
            color: activeTab === t.key ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
          }}>{t.label}</a>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.06)', maxWidth: activeTab === 'opengraph' ? 860 : 760 }}>
        {activeTab === 'opengraph' ? <OpenGraphEditor /> : activeTab === 'ai' ? <AiSettingsEditor /> : <SettingsEditor />}
      </div>
    </>
  )
}
