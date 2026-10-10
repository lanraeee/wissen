import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { masterAdminGuard } from '@/lib/admin-guard'
import AccessControlTabs from '@/components/admin/AccessControlTabs'

export const metadata: Metadata = { title: 'Access Control · Admin · Wissen-Haus' }

// The layout already redirects anyone but the master admin away from this
// path (app/admin/layout.tsx) -- this is the actual security boundary for
// the page itself, same belt-and-suspenders as every other admin page here.
export default async function AccessControlPage() {
  if (!(await masterAdminGuard())) redirect('/admin')
  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Access Control</h1>
        <p className="admin-page-desc">
          See everyone who holds permissions and revoke what is not needed, manage trustee logins and their read or write access, and define reusable roles. Only the master admin account can reach this page.
        </p>
      </div>
      <AccessControlTabs />
    </>
  )
}
