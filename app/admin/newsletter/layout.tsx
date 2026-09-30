import { userAdminGuard } from '@/lib/admin-guard'
import NoAccess from '@/components/admin/NoAccess'

// Mirrors userAdminGuard() on every /api/admin/newsletter route. Newsletter
// sending reaches subscribers directly, so it stays with admins and directors.
export default async function NewsletterLayout({ children }: { children: React.ReactNode }) {
  if (!await userAdminGuard()) return <NoAccess section="Newsletter" />
  return <>{children}</>
}
