import type { Metadata } from 'next'
import SupportQueue from '@/components/admin/SupportQueue'

export const metadata: Metadata = { title: 'Support · Admin · Wissen-Haus' }

export default function AdminSupportPage() {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Support</h1>
        <p className="admin-page-desc">
          Tickets from the support page and the live chat. A chat the assistant could not
          finish arrives here already escalated.
        </p>
      </div>
      <SupportQueue />
    </>
  )
}
