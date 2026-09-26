import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'
import AdminMobileNav from '@/components/admin/AdminMobileNav'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

export function isDirectorSession(email?: string) {
  return email === ADMIN_EMAIL
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const isDirector = session?.email === ADMIN_EMAIL
  const hasAccess = isDirector || session?.role === 'admin' || session?.role === 'editor'
  if (!session || !hasAccess) redirect('/login?mode=login')

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(244,240,231,.12)' }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Wissen-Haus</div>
          <div style={{ fontSize: '.72rem', color: 'rgba(244,240,231,.5)', marginTop: 2 }}>Admin Panel</div>
        </div>
        <AdminNav />
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(244,240,231,.12)', fontSize: '.78rem', color: 'rgba(244,240,231,.45)' }}>
          {session.email}
        </div>
      </aside>

      <AdminMobileNav email={session.email} />

      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
