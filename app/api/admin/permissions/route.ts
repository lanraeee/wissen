import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { masterAdminGuard, isMasterAdmin, isBlockedAdmin, MASTER_ADMIN_EMAIL } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody, zEmail } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'
import { writeContent } from '@/lib/content-approvals'
import { log } from '@/lib/logger'
import { ACCESS_GRANTS_KEY, coerceAccessGrants, type AccessGrants } from '@/lib/admin-access-grants-shared'
import {
  ACCESS_ROLES_KEY, MAX_ROLES, coerceAccessRoles, coerceRoleGrants, effectiveLevels,
  type AccessRoles,
} from '@/lib/admin-access-roles-shared'
import { AI_SETTINGS_KEY, getAiSettings } from '@/lib/ai-settings'
import { coerceAiSettings } from '@/lib/ai-settings-shared'
import { SAFEGUARDING_LEAD_EMAIL } from '@/lib/safeguarding'

export const dynamic = 'force-dynamic'

// The "Current permissions" view and every revoke/assign action behind it.
// Master admin only -- enforced here, not by hiding buttons. All writes go
// through writeContent() so the cached grant/role reads are invalidated and a
// revoke bites on the very next request.

const PAGE_SIZE = 50
const MAX_LISTED = 500
const ACCOUNT_ROLES = ['user', 'trustee', 'editor', 'admin'] as const

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

async function readStore(key: string): Promise<unknown> {
  const rows = await sql`SELECT value FROM site_content WHERE key = ${key}`
  return rows[0]?.value ?? null
}

async function readGrants(): Promise<AccessGrants> { return coerceAccessGrants(await readStore(ACCESS_GRANTS_KEY)) }
async function readRoles(): Promise<AccessRoles> { return coerceAccessRoles(await readStore(ACCESS_ROLES_KEY)) }

async function readSafeguardingTeam(): Promise<string[]> {
  try {
    const rows = await sql`SELECT email FROM cio_safeguarding_team`
    return rows.map(r => String(r.email).trim().toLowerCase())
  } catch (err) {
    log.error('permissions', err, { stage: 'read safeguarding team' })
    return []
  }
}

const likeEscape = (s: string) => s.replace(/[\\%_]/g, c => '\\' + c)

export async function GET(req: NextRequest) {
  const session = await masterAdminGuard()
  if (!session) return forbidden()

  const url = new URL(req.url)
  const all = url.searchParams.get('all') === '1'
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1)

  const [grants, roles, ai, team] = await Promise.all([readGrants(), readRoles(), getAiSettings(), readSafeguardingTeam()])
  const aiEmails = ai.adminAgentAllowedEmails.map(e => e.trim().toLowerCase())
  const stored = Array.from(new Set([
    ...Object.keys(grants.grants), ...Object.keys(roles.assignments), ...aiEmails, ...team, SAFEGUARDING_LEAD_EMAIL, MASTER_ADMIN_EMAIL,
  ]))
  const pattern = '%' + likeEscape(q) + '%'
  const offset = all ? (page - 1) * PAGE_SIZE : 0
  const limit = all ? PAGE_SIZE : MAX_LISTED

  const [rows, count] = await Promise.all([
    sql`
      SELECT id, email, first_name, last_name, role, created_at FROM users
      WHERE (${all}::boolean OR role <> 'user' OR lower(email) = ANY(${stored}))
        AND (${q}::text = '' OR email ILIKE ${pattern} OR first_name ILIKE ${pattern} OR last_name ILIKE ${pattern})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*)::int AS c FROM users
      WHERE (${all}::boolean OR role <> 'user' OR lower(email) = ANY(${stored}))
        AND (${q}::text = '' OR email ILIKE ${pattern} OR first_name ILIKE ${pattern} OR last_name ILIKE ${pattern})
    `,
  ])

  const build = (email: string, user?: Record<string, unknown>) => {
    const key = email.trim().toLowerCase()
    const master = isMasterAdmin(key)
    const direct = grants.grants[key] ?? {}
    return {
      id: user ? String(user.id) : null,
      email: key,
      name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
      accountRole: user ? String(user.role) : 'missing',
      createdAt: user ? user.created_at : null,
      isMasterAdmin: master,
      blocked: isBlockedAdmin(key),
      safeguarding: key === SAFEGUARDING_LEAD_EMAIL ? 'lead' : team.includes(key) ? 'team' : null,
      aiAgent: aiEmails.includes(key),
      directGrants: direct,
      roleIds: roles.assignments[key] ?? [],
      effective: effectiveLevels(key, grants, roles),
    }
  }

  const users = rows.map(r => build(String(r.email), r))
  // Stored permissions whose account no longer exists (deleted, or typed
  // wrongly): still listed so the master admin can clear them.
  if (!all && !q) {
    const have = new Set(users.map(u => u.email))
    for (const email of stored) if (!have.has(email) && email !== SAFEGUARDING_LEAD_EMAIL && !isMasterAdmin(email)) users.push(build(email))
  }

  return NextResponse.json({
    users,
    total: all ? Number(count[0].c) : users.length,
    page, limit: PAGE_SIZE, all,
    aiEnabled: ai.adminAgentEnabled,
    roles: Object.entries(roles.roles).map(([id, r]) => ({ id, ...r })),
  })
}

const email = zEmail.transform(e => e.toLowerCase())
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('revoke_section'), email, section: z.string().max(80) }),
  z.object({ action: z.literal('revoke_ai'), email }),
  z.object({ action: z.literal('revoke_safeguarding'), email }),
  z.object({ action: z.literal('assign_role'), email, roleId: z.string().max(60) }),
  z.object({ action: z.literal('unassign_role'), email, roleId: z.string().max(60) }),
  z.object({ action: z.literal('set_account_role'), email, role: z.enum(ACCOUNT_ROLES) }),
  z.object({ action: z.literal('revoke_all'), email }),
  z.object({
    action: z.literal('save_role'),
    id: z.string().max(60).optional(),
    name: z.string().trim().min(1).max(60),
    description: z.string().trim().max(300).default(''),
    grants: z.record(z.string(), z.enum(['read', 'write'])),
  }),
  z.object({ action: z.literal('delete_role'), id: z.string().max(60) }),
])

async function removeAi(target: string): Promise<boolean> {
  const current = await getAiSettings()
  const kept = current.adminAgentAllowedEmails.filter(e => e.trim().toLowerCase() !== target)
  if (kept.length === current.adminAgentAllowedEmails.length) return false
  await writeContent(AI_SETTINGS_KEY, coerceAiSettings({ ...current, adminAgentAllowedEmails: kept }))
  return true
}

async function removeSafeguarding(target: string): Promise<boolean> {
  if (target === SAFEGUARDING_LEAD_EMAIL) return false
  const rows = await sql`DELETE FROM cio_safeguarding_team WHERE lower(email) = ${target} RETURNING id`
  return rows.length > 0
}

async function saveRoles(roles: AccessRoles) { await writeContent(ACCESS_ROLES_KEY, roles) }
async function saveGrants(grants: AccessGrants) { await writeContent(ACCESS_GRANTS_KEY, grants) }

export async function POST(req: NextRequest) {
  const session = await masterAdminGuard()
  if (!session) return forbidden()
  const { data: body, error } = await parseBody(req, Body)
  if (error) return error

  const act = (action: string, details: Record<string, unknown>) =>
    logActivity(session, `permissions.${action}`, { targetType: 'permissions', targetId: String(details.email ?? details.id ?? ''), details })

  // Role definitions are not about one account.
  if (body.action === 'save_role') {
    const roles = await readRoles()
    const id = body.id ?? `${(body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'role').slice(0, 24)}-${crypto.randomBytes(3).toString('hex')}`
    if (body.id && !roles.roles[body.id]) return bad('Role not found', 404)
    if (!body.id && Object.keys(roles.roles).length >= MAX_ROLES) return bad(`At most ${MAX_ROLES} roles`)
    roles.roles[id] = { name: body.name, description: body.description, grants: coerceRoleGrants(body.grants) }
    await saveRoles(coerceAccessRoles(roles))
    await act(body.id ? 'role_update' : 'role_create', { id, name: body.name, sections: Object.keys(roles.roles[id].grants).length })
    return NextResponse.json({ success: true, id })
  }

  if (body.action === 'delete_role') {
    const roles = await readRoles()
    if (!roles.roles[body.id]) return bad('Role not found', 404)
    const holders = Object.entries(roles.assignments).filter(([, ids]) => ids.includes(body.id)).length
    delete roles.roles[body.id]
    for (const [e, ids] of Object.entries(roles.assignments)) roles.assignments[e] = ids.filter(i => i !== body.id)
    await saveRoles(coerceAccessRoles(roles))
    await act('role_delete', { id: body.id, holders })
    return NextResponse.json({ success: true })
  }

  // Everything below acts on one account, identified by email.
  const target = body.email
  if (isMasterAdmin(target)) return bad('The master admin account cannot be changed.')

  if (body.action === 'revoke_section') {
    const grants = await readGrants()
    if (!grants.grants[target]?.[body.section]) return bad('That section is not granted directly -- it comes from a role.', 404)
    delete grants.grants[target][body.section]
    if (!Object.keys(grants.grants[target]).length) delete grants.grants[target]
    await saveGrants(grants)
    await act('revoke_section', { email: target, section: body.section })

  } else if (body.action === 'revoke_ai') {
    if (!await removeAi(target)) return bad('That account does not have AI agent access.', 404)
    await act('revoke_ai', { email: target })

  } else if (body.action === 'revoke_safeguarding') {
    if (target === SAFEGUARDING_LEAD_EMAIL) return bad('The safeguarding lead is set in configuration and cannot be revoked here.')
    if (!await removeSafeguarding(target)) return bad('That account is not on the safeguarding team.', 404)
    await act('revoke_safeguarding', { email: target })

  } else if (body.action === 'assign_role' || body.action === 'unassign_role') {
    const roles = await readRoles()
    if (!roles.roles[body.roleId]) return bad('Role not found', 404)
    const held = new Set(roles.assignments[target] ?? [])
    if (body.action === 'assign_role') held.add(body.roleId); else held.delete(body.roleId)
    if (held.size) roles.assignments[target] = [...held]; else delete roles.assignments[target]
    await saveRoles(roles)
    await act(body.action, { email: target, roleId: body.roleId })

  } else if (body.action === 'set_account_role') {
    const rows = await sql`SELECT id, role FROM users WHERE lower(email) = ${target}`
    if (!rows.length) return bad('No account with that email.', 404)
    await sql`UPDATE users SET role = ${body.role} WHERE id = ${rows[0].id}`
    await act('set_account_role', { email: target, from: rows[0].role, to: body.role })

  } else if (body.action === 'revoke_all') {
    const cleared: string[] = []
    const grants = await readGrants()
    if (grants.grants[target]) { delete grants.grants[target]; await saveGrants(grants); cleared.push('section grants') }
    const roles = await readRoles()
    if (roles.assignments[target]) { delete roles.assignments[target]; await saveRoles(roles); cleared.push('roles') }
    if (await removeAi(target)) cleared.push('AI agent')
    if (await removeSafeguarding(target)) cleared.push('safeguarding team')
    const rows = await sql`UPDATE users SET role = 'user' WHERE lower(email) = ${target} AND role <> 'user' RETURNING id`
    if (rows.length) cleared.push('account role')
    await act('revoke_all', { email: target, cleared })
    return NextResponse.json({ success: true, cleared })
  }

  return NextResponse.json({ success: true })
}
