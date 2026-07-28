import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.email !== ADMIN_EMAIL) redirect('/login?mode=login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', marginTop: -1 }}>
      <aside style={{ width: 220, background: '#1a3c2e', color: '#f4f0e7', padding: '28px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(244,240,231,.12)' }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Wissen-Haus</div>
          <div style={{ fontSize: '.72rem', color: 'rgba(244,240,231,.5)', marginTop: 2 }}>Admin Panel</div>
        </div>
        <AdminNav />
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(244,240,231,.12)', fontSize: '.78rem', color: 'rgba(244,240,231,.45)' }}>
          {session.email}
        </div>
      </aside>
      <main style={{ flex: 1, padding: '36px 40px', maxWidth: 1200, background: '#f4f0e7', overflowX: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
