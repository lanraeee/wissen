import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TrusteeRegisterEditor from '@/components/admin/TrusteeRegisterEditor'

export const metadata: Metadata = { title: 'Trustee Register · Admin · Wissen-Haus' }

export default async function TrusteeRegisterPage() {
  const session = await getSession()

  if (!session || !session.role || !['director', 'admin'].includes(session.role)) {
    redirect('/admin')
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Trustee Register</h1>
        <p className="admin-page-desc">
          Charity Trustee governance record for Wissen-Haus Empowerment Foundation.
          Only directors can view and manage trustee information required by the Charity Commission.
        </p>
      </div>

      <TrusteeRegisterEditor />
    </>
  )
}
