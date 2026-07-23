import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.email !== ADMIN_EMAIL) redirect('/login?mode=login')

  return (
    <html lang="en">
      <head>
        <style>{`
          .admin-nav-link { display:block;padding:9px 12px;border-radius:8px;color:rgba(244,240,231,.85);text-decoration:none;font-size:.88rem;margin-bottom:2px;font-weight:500;transition:background .15s }
          .admin-nav-link:hover { background:rgba(244,240,231,.1) }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui,sans-serif', background: '#f4f0e7', color: '#1a2e24', minHeight: '100vh' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside style={{ width: 220, background: '#1a3c2e', color: '#f4f0e7', padding: '28px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(244,240,231,.12)' }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Wissen-Haus</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(244,240,231,.5)', marginTop: 2 }}>Admin Panel</div>
            </div>
            <nav style={{ padding: '16px 12px', flex: 1 }}>
              {[
                ['Dashboard', '/admin'],
                ['Users', '/admin/users'],
                ['Submissions', '/admin/submissions'],
                ['Opportunities', '/admin/opportunities'],
              ].map(([label, href]) => (
                <a key={href} href={href} className="admin-nav-link">{label}</a>
              ))}
            </nav>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(244,240,231,.12)', fontSize: '.78rem', color: 'rgba(244,240,231,.45)' }}>
              {session.email}
            </div>
          </aside>
          {/* Main */}
          <main style={{ flex: 1, padding: '36px 40px', maxWidth: 1100 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
