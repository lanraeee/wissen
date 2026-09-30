import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { canUseAdminAgent } from '@/lib/ai-settings'
import { askAdminAgent } from '@/lib/admin-agent'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'
// Six model round-trips, each possibly running a query, comfortably exceeds
// the default budget.
export const maxDuration = 120

const AskSchema = z.object({ question: z.string().min(1).max(4000) })

export async function POST(req: NextRequest) {
  // adminGuard first so a signed-out request never reaches the settings read,
  // then the agent's own narrower check: this reads every table, so it is
  // master-admin-plus-granted, not merely staff.
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await canUseAdminAgent(session.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await parseBody(req, AskSchema)
  if (error) return error

  logActivity(session, 'ai.ask', { targetType: 'ai_agent' })
  const result = await askAdminAgent(session.email, data.question)
  return NextResponse.json(result)
}
