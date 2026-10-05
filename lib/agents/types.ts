// Type definitions for the agent operations system
export type AgentName =
  | 'operations-lead'
  | 'programmes-coordinator'
  | 'community-opportunities'
  | 'supporter-care'
  | 'fundraising-finance'
  | 'communications'
  | 'governance-compliance'
  | 'platform-engineer'

export type ProposalType =
  | 'send_message'
  | 'publish_content'
  | 'approve_transaction'
  | 'schedule_event'
  | 'update_record'
  | 'other'

export interface AgentProposal {
  id: string
  agent_name: AgentName
  proposal_type: ProposalType
  title: string
  description?: string
  evidence?: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
  approver_email?: string
  approver_name?: string
  approved_at?: Date
  executed_at?: Date
  error_message?: string
  created_at: Date
  updated_at: Date
}

export interface AgentSettings {
  agent_name: AgentName
  enabled: boolean
  max_daily_calls?: number
  description?: string
  last_run?: Date
}

export interface AgentAction {
  type: 'autopilot' | 'proposal'
  proposal?: AgentProposal
  result?: {
    success: boolean
    message?: string
    data?: unknown
  }
}

export interface MorningBrief {
  date: string
  generated_at: string
  agent_summaries: Array<{
    agent: AgentName
    status: 'ok' | 'warning' | 'error'
    pending_approvals: number
    last_run?: string
    notes?: string
  }>
  queue_total: number
  daily_call_usage: number
}
