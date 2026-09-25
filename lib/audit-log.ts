import sql from './db'
import { log } from './logger'

export interface Actor {
  id: string
  email: string
  role?: string
}

/**
 * Records one admin-panel write action for the activity audit trail.
 * Best-effort: a logging failure must never break the actual action it's
 * describing, so this only logs (via lib/logger) and swallows the error
 * rather than throwing.
 *
 * actor_role is captured here rather than looked up later from users.role,
 * so the log stays an accurate record of what the actor's role *was* at
 * the time, even if their role changes afterward.
 */
export async function logActivity(
  actor: Actor,
  action: string,
  opts: { targetType?: string; targetId?: string; details?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_activity_log (actor_id, actor_email, actor_role, action, target_type, target_id, details)
      VALUES (
        ${actor.id}, ${actor.email}, ${actor.role ?? 'user'}, ${action},
        ${opts.targetType ?? null}, ${opts.targetId ?? null},
        ${opts.details ? JSON.stringify(opts.details) : null}
      )
    `
  } catch (err) {
    log.error('audit-log', err, { action, actorId: actor.id })
  }
}
