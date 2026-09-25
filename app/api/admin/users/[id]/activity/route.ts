import { NextRequest, NextResponse } from 'next/server'
import { adminGuard, userAdminGuard, directorGuard, isDirector } from '@/lib/admin-guard'
import sql from '@/lib/db'

const LIMIT = 100

interface TargetUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

async function findUser(id: string): Promise<TargetUser | undefined> {
  const [row] = await sql`
    SELECT id, email, first_name, last_name, role FROM users WHERE id = ${id}
  `
  return row as TargetUser | undefined
}

/**
 * Three permission tiers, matched to what the target account can do:
 * - 'user' (an ordinary member): any staff (editor/admin/director) may view.
 * - 'editor': admin or director may view -- an editor's peers cannot audit
 *   each other.
 * - 'admin' or director (isDirector(email), regardless of the role column):
 *   director only.
 */
function tierFor(target: TargetUser): 'user' | 'editor' | 'privileged' {
  if (isDirector(target.email) || target.role === 'admin') return 'privileged'
  if (target.role === 'editor') return 'editor'
  return 'user'
}

async function guardFor(tier: 'user' | 'editor' | 'privileged') {
  if (tier === 'privileged') return directorGuard()
  if (tier === 'editor') return userAdminGuard()
  return adminGuard()
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const target = await findUser(id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tier = tierFor(target)
  const viewer = await guardFor(tier)
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (tier !== 'user') {
    // Staff account: show the admin-panel audit trail, not platform usage --
    // an editor/admin doesn't "use" the site as a learner would.
    const entries = await sql`
      SELECT action, target_type, target_id, details, created_at
      FROM admin_activity_log
      WHERE actor_id = ${id}
      ORDER BY created_at DESC
      LIMIT ${LIMIT}
    `
    return NextResponse.json({ kind: 'staff', target, entries })
  }

  // Ordinary user: platform usage -- what they've done as a learner/community
  // member/donor, plus session history and pages visited.
  const [courseProgress, certificates, submissions, forumThreads, forumReplies, logins, pageViews] = await Promise.all([
    sql`SELECT course_id, module_id, completed_at FROM course_progress WHERE user_id = ${id} ORDER BY completed_at DESC LIMIT ${LIMIT}`,
    sql`SELECT course_id, certificate_id, issued_at FROM certificates WHERE user_id = ${id} ORDER BY issued_at DESC LIMIT ${LIMIT}`,
    sql`SELECT type, status, data, created_at FROM submissions WHERE email = ${target.email} ORDER BY created_at DESC LIMIT ${LIMIT}`,
    sql`SELECT id, title, tag, reply_count, created_at FROM forum_threads WHERE user_id = ${id} ORDER BY created_at DESC LIMIT ${LIMIT}`,
    sql`SELECT id, thread_id, body, created_at FROM forum_replies WHERE user_id = ${id} ORDER BY created_at DESC LIMIT ${LIMIT}`,
    sql`SELECT ip, user_agent, created_at FROM login_events WHERE user_id = ${id} ORDER BY created_at DESC LIMIT ${LIMIT}`,
    sql`SELECT pathname, referrer, country, city, device_type, browser, created_at FROM page_views WHERE user_id = ${id} ORDER BY created_at DESC LIMIT ${LIMIT}`,
  ])

  return NextResponse.json({
    kind: 'user', target,
    courseProgress, certificates, submissions, forumThreads, forumReplies, logins, pageViews,
  })
}
