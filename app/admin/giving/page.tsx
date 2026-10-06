import type { Metadata } from 'next'
import GivingManager from '@/components/admin/GivingManager'

export const metadata: Metadata = { title: 'Monthly Giving · Admin · Wissen-Haus' }

export default function AdminGivingPage() {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="admin-page-title">Monthly Giving</h1>
        <p className="admin-page-desc">Recurring pledges volunteers and partners set up alongside their application.</p>
      </div>
      <GivingManager />
    </>
  )
}
