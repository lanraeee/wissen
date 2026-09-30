import { userAdminGuard } from '@/lib/admin-guard'
import NoAccess from '@/components/admin/NoAccess'

// Mirrors userAdminGuard() on /api/admin/email-templates/[id]. These are the
// transactional emails donors and applicants receive, so editing them stays
// with admins and directors even though the list endpoint is more permissive.
export default async function EmailTemplatesLayout({ children }: { children: React.ReactNode }) {
  if (!await userAdminGuard()) return <NoAccess section="Email Templates" />
  return <>{children}</>
}
