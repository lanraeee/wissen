-- Phase 1 foundation tables for agent operations.
-- Paste this whole file into the Neon SQL Editor and run it once.
-- Safe to re-run: every statement is IF NOT EXISTS.

DO $migration$
BEGIN

CREATE TABLE IF NOT EXISTS agent_proposals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name        TEXT NOT NULL,
  proposal_type     TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  evidence          JSONB,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed','failed')),
  approver_email    TEXT,
  approver_name     TEXT,
  approved_at       TIMESTAMPTZ,
  executed_at       TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_proposals_agent ON agent_proposals(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_status ON agent_proposals(status);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_created ON agent_proposals(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_settings (
  agent_name        TEXT PRIMARY KEY,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  max_daily_calls   INTEGER DEFAULT 200,
  description       TEXT,
  last_run          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed agent settings for Phase 1 and beyond
INSERT INTO agent_settings (agent_name, description) VALUES
  ('operations-lead', 'Runs other agent schedules, morning brief, weekly report'),
  ('programmes-coordinator', 'Career fair registrations, confirmations, reminders'),
  ('community-opportunities', 'Daily opportunities refresh, forum moderation'),
  ('supporter-care', 'Support chat, tickets, inbox triage, replies'),
  ('fundraising-finance', 'Transfer matching, receipts, financial reporting'),
  ('communications', 'Newsletter drafts, site copy, social posts'),
  ('governance-compliance', 'Meeting calendar, registers, filings, declarations'),
  ('platform-engineer', 'CI/CD, dependency alerts, pull requests')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS agent_activity_summary (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name        TEXT NOT NULL,
  summary_date      DATE NOT NULL,
  proposals_sent    INTEGER DEFAULT 0,
  proposals_approved INTEGER DEFAULT 0,
  actions_completed INTEGER DEFAULT 0,
  errors_count      INTEGER DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_name, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_date ON agent_activity_summary(summary_date DESC);

END
$migration$;
