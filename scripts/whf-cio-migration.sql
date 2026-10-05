-- Paste this whole file into the Neon SQL Editor and run it once.
-- It is a single DO block, so the editor accepts it as one command.
-- Safe to re-run: every statement is IF NOT EXISTS.
DO $migration$
BEGIN
CREATE TABLE IF NOT EXISTS cio_constitution_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','adopted','superseded')),
  body_text      TEXT,
  adopted_date   DATE,
  change_summary TEXT,
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cio_registrations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority          TEXT NOT NULL CHECK (authority IN ('charity_commission','companies_house','cac','tin','other')),
  entity_name        TEXT NOT NULL,
  reg_number         TEXT,
  status             TEXT,
  registered_date    DATE,
  registered_address TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cio_meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('trustee','general','written_resolution')),
  title        TEXT NOT NULL,
  location     TEXT,
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','held','cancelled')),
  attendees    TEXT,
  minutes      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_meetings_date ON cio_meetings(meeting_date DESC);

CREATE TABLE IF NOT EXISTS cio_declarations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trustee_id       UUID NOT NULL REFERENCES trustee_register(id) ON DELETE CASCADE,
  declaration_year INTEGER NOT NULL,
  declared_on      DATE NOT NULL,
  has_conflicts    BOOLEAN NOT NULL DEFAULT FALSE,
  details          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trustee_id, declaration_year)
);

CREATE TABLE IF NOT EXISTS cio_policies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  category     TEXT,
  owner        TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','adopted','under_review','retired')),
  adopted_date DATE,
  review_date  DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cio_filings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  authority      TEXT,
  due_date       DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','submitted','not_required')),
  submitted_date DATE,
  reference      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_filings_due ON cio_filings(due_date);

CREATE TABLE IF NOT EXISTS cio_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  category        TEXT,
  linked_type     TEXT,
  linked_id       UUID,
  blob_path       TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  content_type    TEXT,
  size_bytes      INTEGER,
  is_working_copy BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  uploaded_by     TEXT,
  drive_status    TEXT NOT NULL DEFAULT 'pending' CHECK (drive_status IN ('pending','synced','failed','disabled')),
  drive_file_id   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_documents_link ON cio_documents(linked_type, linked_id);

-- WHF-CIO Financial Ledger tab, published read-only at /transparency/ledger.
-- Rows come from the bank-feed connectors in lib/ledger-providers.ts (keyed
-- on source + external_id, so a re-sync updates rather than duplicates) or
-- are typed in by a director (source 'manual', no external_id). A director
-- override sets `overridden`, keeps the provider's values in `original`, and
-- stops later syncs from writing over the row. `counterparty` holds the
-- provider's raw payer/payee text and is never shown publicly: a bank
-- reference often carries a donor's name.
CREATE TABLE IF NOT EXISTS cio_ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL CHECK (source IN ('stripe','tide','uk_bank','ng_bank','manual')),
  account_label   TEXT,
  external_id     TEXT,
  occurred_on     DATE NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('in','out')),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  fee             NUMERIC(14,2),
  currency        TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT,
  counterparty    TEXT,
  is_transfer     BOOLEAN NOT NULL DEFAULT FALSE,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  excluded        BOOLEAN NOT NULL DEFAULT FALSE,
  overridden      BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  original        JSONB,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cio_ledger_external ON cio_ledger_entries(source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cio_ledger_occurred ON cio_ledger_entries(occurred_on DESC, created_at DESC);

-- One row per bank-feed connector: when it last ran and how that went, so
-- the ledger tab can say "Tide: not configured" or "Stripe: failed" rather
-- than showing a quietly stale list.
CREATE TABLE IF NOT EXISTS cio_ledger_sync (
  provider    TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  last_error  TEXT,
  last_count  INTEGER
);

-- WHF-CIO Operational Fixed Costs tab, published at /transparency/costs.
-- Core running costs only (tools, services, admin), not optional overheads
-- such as advertising. `amount` is per billing_cycle; the monthly figure is
-- derived (lib/ledger-shared.ts monthlyEquivalent).
CREATE TABLE IF NOT EXISTS cio_fixed_costs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'tools' CHECK (category IN ('tools','services','admin','other')),
  supplier      TEXT,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency      TEXT NOT NULL DEFAULT 'GBP',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','quarterly','annual')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WHF-CIO Safeguarding tab: the incident log. Readable only by directors and
-- the designated safeguarding team (lib/safeguarding.ts), never by other
-- admins or editors, and never through the admin AI agent
-- (lib/ai-sql-guard.ts). Rows arrive from the report form on /safeguarding,
-- from contact-form messages flagged as safeguarding, or by hand. The partial
-- unique index makes ingestion from another table idempotent.
CREATE TABLE IF NOT EXISTS cio_safeguarding_incidents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT NOT NULL UNIQUE,
  source                TEXT NOT NULL CHECK (source IN ('safeguarding_form','contact_form','support_ticket','manual')),
  source_ref            TEXT,
  reported_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reporter_name         TEXT,
  reporter_email        TEXT,
  reporter_phone        TEXT,
  reporter_relationship TEXT,
  person_at_risk        TEXT NOT NULL DEFAULT 'unknown' CHECK (person_at_risk IN ('child','adult_at_risk','other','unknown')),
  concern_type          TEXT,
  description           TEXT NOT NULL,
  location              TEXT,
  immediate_danger      BOOLEAN NOT NULL DEFAULT FALSE,
  risk_level            TEXT NOT NULL DEFAULT 'unassessed' CHECK (risk_level IN ('unassessed','low','medium','high','critical')),
  status                TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaging','referred','monitoring','closed')),
  assigned_to           TEXT,
  actions_taken         TEXT,
  referred_to           TEXT,
  outcome               TEXT,
  closed_on             DATE,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cio_sg_status ON cio_safeguarding_incidents(status, reported_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cio_sg_source_ref ON cio_safeguarding_incidents(source, source_ref) WHERE source_ref IS NOT NULL;

-- Designated safeguarding team members, set by directors. The lead address
-- (SAFEGUARDING_LEAD_EMAIL, default safeguarding@wissenhaus.org) always has
-- access whether or not it has a row here.
CREATE TABLE IF NOT EXISTS cio_safeguarding_team (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  role_title TEXT,
  added_by   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
END
$migration$;
