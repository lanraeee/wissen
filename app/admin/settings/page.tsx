import type { Metadata } from 'next'
import SettingsEditor from '@/components/admin/SettingsEditor'

export const metadata: Metadata = { title: 'Settings · Admin · Wissen-Haus' }

export default function AdminSettings() {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Settings</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Global site configuration — contact details, social links, and display settings.</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.06)', maxWidth: 760 }}>
        <SettingsEditor />
      </div>
    </>
  )
}
