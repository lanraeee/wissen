import type { Metadata } from 'next'
import SettingsEditor from '@/components/admin/SettingsEditor'

export const metadata: Metadata = { title: 'Settings · Admin · Wissen-Haus' }

export default function AdminSettings() {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-desc">Global site configuration â€” contact details, social links, and display settings.</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.06)', maxWidth: 760 }}>
        <SettingsEditor />
      </div>
    </>
  )
}
