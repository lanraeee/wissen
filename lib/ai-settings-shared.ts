// Client-safe half of the AI settings: shape and defaults, no server imports,
// so the admin editor can render the same defaults the server falls back to.

/**
 * Where model calls are sent. Both routes speak the same Anthropic Messages
 * API; see lib/ai-provider.ts for the three differences between them.
 */
export type AiProvider = 'anthropic' | 'vercel'

export type AiSettings = {
  /**
   * 'anthropic' calls api.anthropic.com directly with ANTHROPIC_API_KEY.
   * 'vercel' routes through the AI Gateway with AI_GATEWAY_API_KEY, which
   * adds observability and provider fallback, and works on deployed
   * functions via OIDC even without a key set.
   */
  provider: AiProvider
  /** Model used by the visitor-facing support agent. */
  supportModel: string
  /** Hard ceiling on Anthropic calls per calendar month, across both agents. */
  monthlyCallCap: number
  /**
   * Extra context appended to the support agent's instructions. Deliberately
   * ADDITIVE: the safety rules (never hand out payment details, never promise
   * a scholarship, never invent a deadline) live in code and cannot be edited
   * away from here. An admin can teach the agent about the organisation; an
   * admin cannot turn the guardrails off, which is the difference between a
   * setting and a liability.
   */
  supportExtraContext: string
  /** Kill switch for the visitor-facing chat agent. */
  supportEnabled: boolean

  /**
   * Master switch for the staff-facing database agent. Off, only the master
   * admin can reach it -- they keep access regardless so the agent can still
   * be diagnosed while it is switched off for everyone else.
   */
  adminAgentEnabled: boolean
  /**
   * Staff the master admin has granted access to, by email. The master admin
   * is never listed here: their access comes from isMasterAdmin() and cannot
   * be revoked by editing this list, so there is no way to lock the only
   * account that can manage the agent out of managing it.
   */
  adminAgentAllowedEmails: string[]
  adminAgentModel: string
  /** How many query-then-reason rounds the admin agent may take per question. */
  adminAgentMaxTurns: number
}

export const AI_SETTINGS_DEFAULTS: AiSettings = {
  provider: 'anthropic',
  supportModel: 'claude-sonnet-5',
  monthlyCallCap: 1500,
  supportExtraContext: '',
  supportEnabled: true,
  adminAgentEnabled: false,
  adminAgentAllowedEmails: [],
  adminAgentModel: 'claude-sonnet-5',
  adminAgentMaxTurns: 6,
}

// Bounds applied wherever these are read, not only where they are written: a
// value that reached the database before a bound existed, or through a direct
// edit, must still not be able to uncap spend or loop the agent forever.
export function coerceAiSettings(raw: unknown): AiSettings {
  const v = (raw ?? {}) as Partial<AiSettings>
  const num = (n: unknown, fallback: number, min: number, max: number) => {
    const x = Number(n)
    return Number.isFinite(x) ? Math.min(Math.max(Math.floor(x), min), max) : fallback
  }
  return {
    provider: v.provider === 'vercel' ? 'vercel' : 'anthropic',
    supportModel: typeof v.supportModel === 'string' && v.supportModel.trim()
      ? v.supportModel.trim() : AI_SETTINGS_DEFAULTS.supportModel,
    monthlyCallCap: num(v.monthlyCallCap, AI_SETTINGS_DEFAULTS.monthlyCallCap, 0, 100_000),
    supportExtraContext: typeof v.supportExtraContext === 'string'
      ? v.supportExtraContext.slice(0, 4_000) : '',
    supportEnabled: v.supportEnabled !== false,
    adminAgentEnabled: v.adminAgentEnabled === true,
    adminAgentAllowedEmails: Array.isArray(v.adminAgentAllowedEmails)
      ? v.adminAgentAllowedEmails
          .filter((e): e is string => typeof e === 'string' && e.includes('@'))
          .map(e => e.trim().toLowerCase())
          .slice(0, 50)
      : [],
    adminAgentModel: typeof v.adminAgentModel === 'string' && v.adminAgentModel.trim()
      ? v.adminAgentModel.trim() : AI_SETTINGS_DEFAULTS.adminAgentModel,
    adminAgentMaxTurns: num(v.adminAgentMaxTurns, AI_SETTINGS_DEFAULTS.adminAgentMaxTurns, 1, 12),
  }
}

export const AI_SETTINGS_KEY = 'ai_settings'
