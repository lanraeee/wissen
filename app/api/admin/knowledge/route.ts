import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard, directorGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { rebuildKnowledgeBase } from '@/lib/knowledge-base'
import { logActivity } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  if (!(await adminGuard() || await sectionGuard('knowledge'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? 'active'
  const rows = status === 'all'
    ? await sql`SELECT id, source, source_key, title, body, status, approved_by, updated_at
                FROM kb_entries ORDER BY status, updated_at DESC LIMIT 400`
    : await sql`SELECT id, source, source_key, title, body, status, approved_by, updated_at
                FROM kb_entries WHERE status = ${status} ORDER BY updated_at DESC LIMIT 400`

  const counts = await sql`SELECT status, COUNT(*)::int AS n FROM kb_entries GROUP BY status`
  return NextResponse.json({ entries: rows, counts })
}

const ActionSchema = z.object({
  action: z.enum(['rebuild', 'approve', 'archive', 'restore', 'delete']),
  id: z.string().uuid().nullish(),
})

export async function POST(req: NextRequest) {
  // Rebuilding and approving both change what the agent tells the public, so
  // they sit with directors rather than with anyone who can open the tab.
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await parseBody(req, ActionSchema)
  if (error) return error

  if (data.action === 'rebuild') {
    const result = await rebuildKnowledgeBase()
    logActivity(session, 'kb.rebuild', { targetType: 'kb_entries' })
    return NextResponse.json({ success: true, ...result })
  }

  if (!data.id) return NextResponse.json({ error: 'An entry is required' }, { status: 400 })

  if (data.action === 'approve') {
    await sql`UPDATE kb_entries SET status = 'active', approved_by = ${session.email}, updated_at = NOW() WHERE id = ${data.id}`
  } else if (data.action === 'archive') {
    await sql`UPDATE kb_entries SET status = 'archived', updated_at = NOW() WHERE id = ${data.id}`
  } else if (data.action === 'restore') {
    await sql`UPDATE kb_entries SET status = 'active', updated_at = NOW() WHERE id = ${data.id}`
  } else if (data.action === 'delete') {
    // Only staff-written entries are deletable. A 'server' entry would simply
    // reappear on the next rebuild, so archiving is the honest verb there.
    await sql`DELETE FROM kb_entries WHERE id = ${data.id} AND source = 'answer'`
  }

  logActivity(session, `kb.${data.action}`, { targetType: 'kb_entries', targetId: data.id })
  return NextResponse.json({ success: true })
}
