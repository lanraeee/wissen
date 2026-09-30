import { userAdminGuard } from '@/lib/admin-guard'
import NoAccess from '@/components/admin/NoAccess'

// The page itself is a client component, so the role check lives here: a
// segment layout runs on the server and wraps every route under /admin/users.
// Mirrors userAdminGuard() on the routes this page calls.
export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  if (!await userAdminGuard()) return <NoAccess section="Users" />
  return <>{children}</>
}
