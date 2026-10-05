import { NextRequest, NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { getPendingProposals, approveProposal, rejectProposal } from '@/lib/agents/runner'
import sql from '@/lib/db'
import { log } from '@/lib/logger'

/**
 * GET /api/admin/agents/proposals - List pending proposals
 * POST - Approve or reject a proposal (directors only)
 */
export async function GET(request: NextRequest) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const proposals = await sql`
      SELECT * FROM agent_proposals
      WHERE status IN ('pending', 'approved', 'rejected')
      ORDER BY created_at DESC
      LIMIT 100
    `
    return NextResponse.json({ proposals })
  } catch (err) {
    log.error('proposals-api', err)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json() as {
      proposal_id: string
      action: 'approve' | 'reject'
    }

    if (!body.proposal_id || !body.action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (body.action === 'approve') {
      const success = await approveProposal(body.proposal_id, session.email, session.name || 'Unknown')
      if (!success) throw new Error('Failed to approve proposal')
    } else if (body.action === 'reject') {
      const success = await rejectProposal(body.proposal_id, session.email)
      if (!success) throw new Error('Failed to reject proposal')
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    log.info('proposal-action', body.action, { proposal_id: body.proposal_id, by: session.email })
    return NextResponse.json({ ok: true, action: body.action })
  } catch (err) {
    log.error('proposals-api', err)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
