import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession } from '@/lib/auth'
import { adminRole, isMasterAdmin as checkIsMasterAdmin } from '@/lib/admin-guard'
import { canAccessAdminPath, PATH_HEADER, SAFEGUARDING_HOME, ACCESS_CONTROL_PATH } from '@/lib/admin-access'
import { getGrantedSections } from '@/lib/admin-access-grants'
import { firstGrantedPath } from '@/lib/admin-sections'
import { canUseAdminAgent } from '@/lib/ai-settings'
import AdminNav from '@/components/admin/AdminNav'
import AdminMobileNav from '@/components/admin/AdminMobileNav'
import { getBrand } from '@/lib/brand-server'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  // adminRole() resolves through isDirector(), which admits BOTH director
  // addresses. This file used to compare against FOUNDER_EMAIL alone, which
  // silently demoted wissenhaus@outlook.com to whatever its stored role said.
  const role = await adminRole()
  if (!session || !role) redirect('/login?mode=login')
  const path = (await headers()).get(PATH_HEADER)
  const masterAdmin = checkIsMasterAdmin(session.email)

  // Only the master admin may reach the page that grants every other
  // section -- not even a director. See lib/admin-access.ts's
  // ACCESS_CONTROL_PATH and app/admin/access-control/page.tsx (which
  // re-checks this itself; this is the UX-level redirect, not the security
  // boundary).
  if (path?.startsWith(ACCESS_CONTROL_PATH) && !masterAdmin) redirect('/admin')

  // The safeguarding team holds no other admin role, so unlike editors (whose
  // restricted sections each refuse in their own layout) they are fenced in
  // here, once: anything outside WHF-CIO Records sends them to their tab. The
  // dashboard alone would otherwise show them user counts and recent signups.
  if (role === 'safeguarding') {
    if (!path || !canAccessAdminPath(role, path)) redirect(SAFEGUARDING_HOME)
  }

  // Trustee accounts: same fencing idea as safeguarding, but the allowed set
  // is per-account instead of fixed, so it's read from the grants store
  // every request (cheap: one site_content row, same as ai_settings).
  let grantedSections: string[] = []
  if (role === 'trustee') {
    grantedSections = await getGrantedSections(session.email)
    // Always allowed, regardless of grants -- otherwise a trustee with zero
    // sections granted has nowhere the redirect below can legally send them.
    const isNoAccessPage = path === '/admin/no-access'
    if (!isNoAccessPage && (!path || !canAccessAdminPath(role, path, false, grantedSections))) {
      redirect(firstGrantedPath(grantedSections) ?? '/admin/no-access')
    }
  }

  const canUseAgent = await canUseAdminAgent(session.email)
  const brand = await getBrand()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(244,240,231,.12)' }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{brand.name}</div>
          <div style={{ fontSize: '.72rem', color: 'rgba(244,240,231,.5)', marginTop: 2 }}>Admin Panel</div>
        </div>
        <AdminNav role={role} canUseAgent={canUseAgent} grantedSections={grantedSections} isMasterAdmin={masterAdmin} />
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(244,240,231,.12)' }}>
          <div style={{ fontSize: '.78rem', color: 'rgba(244,240,231,.45)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.email}
          </div>
          <AdminLogoutButton style={{ fontSize: '.8rem', fontWeight: 600, color: 'rgba(244,240,231,.75)' }} />
        </div>
      </aside>

      <AdminMobileNav email={session.email} role={role} canUseAgent={canUseAgent} grantedSections={grantedSections} isMasterAdmin={masterAdmin} />

      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
