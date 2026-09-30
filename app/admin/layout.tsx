import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { adminRole } from '@/lib/admin-guard'
import AdminNav from '@/components/admin/AdminNav'
import AdminMobileNav from '@/components/admin/AdminMobileNav'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  // adminRole() resolves through isDirector(), which admits BOTH director
  // addresses. This file used to compare against FOUNDER_EMAIL alone, which
  // silently demoted wissenhaus@outlook.com to whatever its stored role said.
  const role = await adminRole()
  if (!session || !role) redirect('/login?mode=login')

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(244,240,231,.12)' }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Wissen-Haus</div>
          <div style={{ fontSize: '.72rem', color: 'rgba(244,240,231,.5)', marginTop: 2 }}>Admin Panel</div>
        </div>
        <AdminNav role={role} />
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(244,240,231,.12)' }}>
          <div style={{ fontSize: '.78rem', color: 'rgba(244,240,231,.45)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.email}
          </div>
          <AdminLogoutButton style={{ fontSize: '.8rem', fontWeight: 600, color: 'rgba(244,240,231,.75)' }} />
        </div>
      </aside>

      <AdminMobileNav email={session.email} role={role} />

      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
