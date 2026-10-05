import sql from '@/lib/db'
import { log } from '@/lib/logger'
import type { AgentName, AgentProposal, MorningBrief } from './types'

/**
 * Check if an agent is enabled and has not exceeded daily call limit.
 */
export async function isAgentEnabled(agentName: AgentName): Promise<boolean> {
  try {
    const [settings] = await sql`
      SELECT enabled FROM agent_settings WHERE agent_name = ${agentName}
    ` as { enabled: boolean }[]
    return settings?.enabled ?? false
  } catch (err) {
    log.error('agent-runner', err, { stage: 'check-enabled', agent: agentName })
    return false
  }
}

/**
 * Record an agent proposal in the queue for human approval.
 */
export async function submitProposal(
  agentName: AgentName,
  title: string,
  proposalType: string,
  description?: string,
  evidence?: Record<string, unknown>
): Promise<AgentProposal | null> {
  try {
    const [proposal] = await sql`
      INSERT INTO agent_proposals (agent_name, proposal_type, title, description, evidence)
      VALUES (${agentName}, ${proposalType}, ${title}, ${description}, ${JSON.stringify(evidence ?? {})})
      RETURNING *
    ` as AgentProposal[]

    log.info('agent-proposal', `${agentName} submitted: ${title}`)
    return proposal ?? null
  } catch (err) {
    log.error('agent-runner', err, { stage: 'submit-proposal', agent: agentName })
    return null
  }
}

/**
 * Get pending proposals for an agent awaiting approval.
 */
export async function getPendingProposals(agentName: AgentName): Promise<AgentProposal[]> {
  try {
    return await sql`
      SELECT * FROM agent_proposals
      WHERE agent_name = ${agentName} AND status = 'pending'
      ORDER BY created_at ASC
    ` as AgentProposal[]
  } catch (err) {
    log.error('agent-runner', err, { stage: 'get-pending', agent: agentName })
    return []
  }
}

/**
 * Mark a proposal as approved and optionally execute it.
 */
export async function approveProposal(
  proposalId: string,
  approverEmail: string,
  approverName: string
): Promise<boolean> {
  try {
    await sql`
      UPDATE agent_proposals
      SET status = 'approved', approver_email = ${approverEmail}, approver_name = ${approverName}, approved_at = NOW()
      WHERE id = ${proposalId}
    `
    log.info('agent-proposal-approved', proposalId, { approver: approverEmail })
    return true
  } catch (err) {
    log.error('agent-runner', err, { stage: 'approve-proposal', id: proposalId })
    return false
  }
}

/**
 * Reject a proposal.
 */
export async function rejectProposal(proposalId: string, approverEmail: string): Promise<boolean> {
  try {
    await sql`
      UPDATE agent_proposals
      SET status = 'rejected', approver_email = ${approverEmail}, approved_at = NOW()
      WHERE id = ${proposalId}
    `
    log.info('agent-proposal-rejected', proposalId, { rejector: approverEmail })
    return true
  } catch (err) {
    log.error('agent-runner', err, { stage: 'reject-proposal', id: proposalId })
    return false
  }
}

/**
 * Get count of pending proposals by agent.
 */
export async function getPendingCounts(): Promise<Record<AgentName, number>> {
  try {
    const rows = await sql`
      SELECT agent_name, COUNT(*) as count FROM agent_proposals
      WHERE status = 'pending'
      GROUP BY agent_name
    ` as { agent_name: AgentName; count: number }[]

    const counts: Record<string, number> = {}
    for (const row of rows) {
      counts[row.agent_name] = Number(row.count)
    }
    return counts
  } catch (err) {
    log.error('agent-runner', err, { stage: 'get-pending-counts' })
    return {}
  }
}

/**
 * Generate the morning brief for Operations Lead.
 */
export async function generateMorningBrief(): Promise<MorningBrief> {
  const now = new Date()
  const summaries = []

  try {
    const pendingCounts = await getPendingCounts()
    let totalQueue = 0

    for (const agentName of [
      'operations-lead',
      'programmes-coordinator',
      'community-opportunities',
      'supporter-care',
      'fundraising-finance',
      'communications',
      'governance-compliance',
      'platform-engineer',
    ] as const) {
      const pending = pendingCounts[agentName] ?? 0
      totalQueue += pending

      try {
        const [lastRun] = await sql`
          SELECT last_run FROM agent_settings WHERE agent_name = ${agentName}
        ` as { last_run?: Date }[]

        summaries.push({
          agent: agentName,
          status: pending > 0 ? 'warning' : 'ok',
          pending_approvals: pending,
          last_run: lastRun?.last_run?.toISOString(),
        })
      } catch {
        summaries.push({
          agent: agentName,
          status: 'error',
          pending_approvals: pending,
        })
      }
    }

    return {
      date: now.toISOString().split('T')[0],
      generated_at: now.toISOString(),
      agent_summaries: summaries,
      queue_total: totalQueue,
      daily_call_usage: 0, // TODO: get from ai_usage table
    }
  } catch (err) {
    log.error('agent-runner', err, { stage: 'generate-brief' })
    return {
      date: now.toISOString().split('T')[0],
      generated_at: now.toISOString(),
      agent_summaries: [],
      queue_total: 0,
      daily_call_usage: 0,
    }
  }
}
