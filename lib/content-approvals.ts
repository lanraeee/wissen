import { revalidateTag } from 'next/cache'
import sql from '@/lib/db'
import { siteContentTag } from '@/lib/site-content'

// One write path for site_content, shared by the direct save (admins and
// directors) and by approving an editor's proposal. Keeping it in one place is
// what stops an approved change from landing without the revalidation that
// makes it show up immediately -- the two routes would otherwise drift.
export async function writeContent(key: string, value: unknown) {
  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
  `
  revalidateTag(siteContentTag(key))
}

export type ContentChangeRequest = {
  id: string
  content_key: string
  proposed_value: unknown
  previous_value: unknown
  status: 'pending' | 'approved' | 'rejected'
  requested_by_email: string
  requested_at: string
  reviewed_by_email: string | null
  reviewed_at: string | null
  review_note: string | null
}

export async function pendingContentRequestCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS n FROM content_change_requests WHERE status = 'pending'`
  return rows[0]?.n ?? 0
}
