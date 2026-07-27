import sql from '@/lib/db'
import PageLoader from './PageLoader'

export default async function LoaderWrapper() {
  let enabled = true
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'site_settings'`
    const val = rows[0]?.value as { loader_enabled?: boolean } | undefined
    if (val?.loader_enabled === false) enabled = false
  } catch {
    // keep default
  }
  if (!enabled) return null
  return <PageLoader />
}
